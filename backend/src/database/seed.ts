import type { CreateProductData } from '../models/product.model.js';
import { hashPasswordSync } from '../utils/password.js';
import { withTransaction, type DB, type SqlParams } from './connection.js';

export const DEMO_USERS = {
  admin: { name: 'Administrador TechStock', email: 'admin@techstock.com', password: 'Admin123*' },
  employee: { name: 'Laura Gómez', email: 'empleado@techstock.com', password: 'Empleado123*' },
} as const;

const DEMO_PRODUCTS: CreateProductData[] = [
  { sku: 'LAP-ASUS-001', name: 'Portátil ASUS Vivobook 15', description: 'Intel Core i5, 16 GB RAM, SSD 512 GB, pantalla 15.6" FHD', category: 'Laptops', price: 2_499_900, stock: 12, minStock: 4 },
  { sku: 'LAP-LEN-002', name: 'Lenovo IdeaPad Slim 3', description: 'AMD Ryzen 7, 16 GB RAM, SSD 1 TB', category: 'Laptops', price: 2_899_000, stock: 3, minStock: 4 },
  { sku: 'LAP-HP-003', name: 'HP Victus Gaming 15', description: 'Ryzen 5, RTX 4050, 16 GB RAM', category: 'Laptops', price: 3_999_900, stock: 7, minStock: 3 },
  { sku: 'CEL-SAM-001', name: 'Samsung Galaxy A56', description: '256 GB, 8 GB RAM, cámara 50 MP', category: 'Celulares', price: 1_699_900, stock: 25, minStock: 8 },
  { sku: 'CEL-XIA-002', name: 'Xiaomi Redmi Note 14 Pro', description: '256 GB, pantalla AMOLED 120 Hz', category: 'Celulares', price: 1_349_000, stock: 0, minStock: 6 },
  { sku: 'CEL-MOT-003', name: 'Motorola Edge 50 Fusion', description: '256 GB, carga rápida 68 W', category: 'Celulares', price: 1_199_900, stock: 14, minStock: 5 },
  { sku: 'MON-LG-001', name: 'Monitor LG UltraGear 27"', description: 'QHD 165 Hz, IPS, 1 ms', category: 'Monitores', price: 1_299_000, stock: 9, minStock: 3 },
  { sku: 'MON-SAM-002', name: 'Monitor Samsung 24" FHD', description: 'IPS 75 Hz, bordes delgados', category: 'Monitores', price: 549_900, stock: 2, minStock: 5 },
  { sku: 'COM-RAM-001', name: 'Memoria RAM Kingston Fury 16 GB', description: 'DDR4 3200 MHz', category: 'Componentes', price: 219_900, stock: 40, minStock: 10 },
  { sku: 'COM-SSD-002', name: 'SSD NVMe Samsung 990 EVO 1 TB', description: 'PCIe 4.0, hasta 5000 MB/s', category: 'Componentes', price: 429_900, stock: 18, minStock: 6 },
  { sku: 'ACC-LOG-001', name: 'Mouse Logitech MX Master 3S', description: 'Inalámbrico, 8000 DPI, silencioso', category: 'Accesorios', price: 459_900, stock: 11, minStock: 4 },
  { sku: 'ACC-RED-002', name: 'Teclado mecánico Redragon Kumara', description: 'Switches rojos, retroiluminado', category: 'Accesorios', price: 189_900, stock: 4, minStock: 5 },
  { sku: 'AUD-SNY-001', name: 'Audífonos Sony WH-1000XM5', description: 'Cancelación de ruido, 30 h de batería', category: 'Audio', price: 1_599_000, stock: 6, minStock: 2 },
  { sku: 'AUD-JBL-002', name: 'Parlante JBL Flip 6', description: 'Bluetooth, resistente al agua IP67', category: 'Audio', price: 549_000, stock: 20, minStock: 5 },
];

export function seedDatabase(db: DB, options: { products?: boolean } = {}): void {
  const { products = true } = options;
  const userCount = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
  );

  withTransaction(db, () => {
    if (userCount === 0) {
      const { admin, employee } = DEMO_USERS;
      insertUser.run(admin.name, admin.email, hashPasswordSync(admin.password), 'admin');
      insertUser.run(employee.name, employee.email, hashPasswordSync(employee.password), 'employee');
    }

    const productCount = (db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }).n;
    if (products && productCount === 0) {
      const insertProduct = db.prepare(
        `INSERT INTO products (sku, name, description, category, price, stock, min_stock, created_by)
         VALUES (@sku, @name, @description, @category, @price, @stock, @minStock, 1)`,
      );
      for (const product of DEMO_PRODUCTS) insertProduct.run(product as unknown as SqlParams);
    }
  });
}
