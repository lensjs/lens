/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import UsersController from '#controllers/users_controller'
import router from '@adonisjs/core/services/router'
import cache from '@adonisjs/cache/services/main'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Mail Route — captured by the Lens mail watcher via the `mail:sent` event
router.get('/send-email', async () => {
  await mail.send((message) => {
    message
      .from('no-reply@lensjs.dev', 'LensJS Demo')
      .to('jane@example.com', 'Jane Doe')
      .cc('team@example.com')
      .subject('Welcome to LensJS on AdonisJS')
      .html('<h1>Hello from AdonisJS</h1><p>This email was captured by Lens.</p>')
      .text('Hello from AdonisJS. This email was captured by Lens.')
  })

  return { message: 'Email sent' }
})

router.get('/create-user', [UsersController, 'create'])

// Cache Routes
router.get('set-cache', async () => {
  await cache.set({
    key: 'name',
    value: 'John Doe',
    ttl: '1h',
  })
})

router.get('get-cache', async () => {
  await User.first()
  return await cache.get({
    key: 'name',
  })
})
router.get('has-cache', async () => {
  return await cache.has({
    key: 'test',
  })
})

router.get('clear-cache', async () => {
  return await cache.clear()
})

router.get('delete-cache', async () => {
  return await cache.delete({
    key: 'test',
  })
})

// Throw Exception

router.get('throw-error', async () => {
  throw new Error('This is an error')
})

// Demo: a single request that exercises EVERY Lens watcher — request, query,
// cache, mail and exception — all correlated to the same request in the UI.
router.get('all-watchers', async () => {
  // Query watcher (Lucid)
  await User.create({
    name: 'Lens Demo',
    email: `demo-${Date.now()}@lensjs.dev`,
    password: 'secret',
  })
  await User.all()

  // Cache watcher
  await cache.set({ key: 'demo:all-watchers', value: 'John Doe', ttl: '1h' })
  await cache.get({ key: 'demo:all-watchers' })

  // Mail watcher
  await mail.send((message) => {
    message
      .from('demo@lensjs.dev', 'LensJS Demo')
      .to('inbox@example.com')
      .subject('All watchers demo')
      .html('<p>This request touched every Lens watcher.</p>')
      .text('This request touched every Lens watcher.')
  })

  // Exception watcher — intentional; recorded and correlated to this request.
  throw new Error('Intentional demo exception from /all-watchers')
})
