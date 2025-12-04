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

router.get('/', async () => {
  return {
    hello: 'world',
  }
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
