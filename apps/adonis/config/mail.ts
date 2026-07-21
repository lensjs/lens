import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',
  from: {
    address: 'no-reply@lensjs.dev',
    name: 'LensJS Demo',
  },
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST', 'smtp.ethereal.email'),
      port: env.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME', ''),
        pass: env.get('SMTP_PASSWORD', ''),
      },
    }),
  },
})

export default mailConfig
