import {registerAs} from '@nestjs/config';

export default registerAs('config', () => ({
  db: {
    type: process.env.DATABASE_TYPE,
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    synchronize: process.env.DATABASE_SYNCHRONIZE,
  },
}));
