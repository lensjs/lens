import User from '#models/user'
import { faker } from '@faker-js/faker'

export default class UsersController {
  public async create() {
    const user = await User.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    })

    return {
      message: 'User created successfully',
      data: user,
    }
  }
}
