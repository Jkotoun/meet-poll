import { validateEnvironment } from '../config/environment.js';
import { createMikroOrmOptions } from './mikro-orm.options.js';

export default createMikroOrmOptions(
  validateEnvironment(process.env).DATABASE_URL,
);
