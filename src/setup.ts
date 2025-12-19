import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config();
const dbName = process.env.DB_NAME || 'bdb';
async function setupDatabase() {
  const connection = knex({ client: 'mysql2', connection: { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306, user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '' } });
  try {
    console.log('🚀 Iniciando setup...\n');
    await connection.raw(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`🗑️  Banco antigo removido`);
    await connection.raw(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Banco "${dbName}" criado!`);
    await connection.destroy();
    const db = knex({ client: 'mysql2', connection: { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306, user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: dbName } });
    console.log('\n📋 Criando tabelas...');
    await db.schema.createTable('usuarios', (table: any) => { table.increments('id').primary(); table.string('nome', 100).notNullable(); table.string('email', 100).notNullable().unique(); table.string('telefone', 20); table.string('endereco', 200); table.string('senha', 255).notNullable(); table.timestamp('created_at').defaultTo(db.fn.now()); });
    await db.schema.createTable('livros', (table: any) => { table.increments('id').primary(); table.string('titulo', 150).notNullable(); table.string('autor', 100).notNullable(); table.integer('ano_lancamento').notNullable(); table.enum('status', ['disponivel', 'alugado']).defaultTo('disponivel'); table.timestamp('created_at').defaultTo(db.fn.now()); });
    await db.schema.createTable('alugueis', (table: any) => { table.increments('id').primary(); table.integer('usuario_id').unsigned().notNullable(); table.integer('livro_id').unsigned().notNullable(); table.timestamp('data_aluguel').defaultTo(db.fn.now()); table.timestamp('data_devolucao').nullable(); table.foreign('usuario_id').references('usuarios.id').onDelete('CASCADE'); table.foreign('livro_id').references('livros.id').onDelete('CASCADE'); });
    console.log('✅ Tabelas criadas!\n🎉 Setup concluído!\n');
    await db.destroy(); process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    await connection.destroy(); process.exit(1);
  }
}
setupDatabase();
