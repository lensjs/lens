import { Sequelize } from 'sequelize-typescript';
import { attachSequelizeLens } from '@lensjs/watchers';
import { TestModel } from './models/user.model.js';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'mysql',
        host: 'localhost',
        port: 3306,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        benchmark: true,
        logQueryParameters: true,
      });

      // Correlates each query to the request that issued it.
      attachSequelizeLens(sequelize);

      sequelize.addModels([TestModel]);
      await sequelize.sync();
      return sequelize;
    },
  },
];
