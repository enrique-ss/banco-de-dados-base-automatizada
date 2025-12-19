import knex from 'knex';
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const dbName = process.env.DB_NAME || 'bdb';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pergunta(texto: string): Promise<string> {
  return new Promise((resolve) => rl.question(texto, resolve));
}

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName
  }
});

// ========== USUÁRIOS ==========
async function listarUsuarios() {
  const usuarios = await db('usuarios').select('id', 'nome', 'email', 'telefone', 'endereco');
  if (usuarios.length > 0) {
    console.log('\n📋 Usuários cadastrados:');
    console.table(usuarios);
  } else {
    console.log('\n📋 Nenhum usuário cadastrado.\n');
  }
}

async function adicionarUsuario() {
  console.log('\n➕ ADICIONAR USUÁRIO\n');
  const nome = await pergunta('Nome: ');
  const email = await pergunta('Email: ');
  const telefone = await pergunta('Telefone: ');
  const endereco = await pergunta('Endereço: ');
  const senha = await pergunta('Senha: ');
  try {
    await db('usuarios').insert({ nome, email, telefone, endereco, senha });
    console.log('\n✅ Usuário adicionado!\n');
  } catch (error: any) {
    console.log('\n❌ Erro:', error.code === 'ER_DUP_ENTRY' ? 'Email já existe!' : error.message);
  }
}

async function atualizarUsuario() {
  await listarUsuarios();
  console.log('\n✏️  ATUALIZAR USUÁRIO\n');
  const id = await pergunta('ID: ');
  const nome = await pergunta('Nome: ');
  const email = await pergunta('Email: ');
  const telefone = await pergunta('Telefone: ');
  const endereco = await pergunta('Endereço: ');
  try {
    const result = await db('usuarios').where({ id }).update({ nome, email, telefone, endereco });
    console.log(result > 0 ? '\n✅ Atualizado!\n' : '\n❌ Não encontrado!\n');
  } catch (error: any) {
    console.log('\n❌ Erro:', error.message);
  }
}

async function deletarUsuario() {
  await listarUsuarios();
  console.log('\n🗑️  DELETAR USUÁRIO\n');
  const id = await pergunta('ID: ');
  const conf = await pergunta('Confirma? (s/n): ');
  if (conf.toLowerCase() === 's') {
    const result = await db('usuarios').where({ id }).delete();
    console.log(result > 0 ? '\n✅ Deletado!\n' : '\n❌ Não encontrado!\n');
  } else {
    console.log('\n❌ Cancelado.\n');
  }
}

// ========== LIVROS ==========
async function listarLivros() {
  const livros = await db('livros').select('*');
  if (livros.length > 0) {
    console.log('\n📚 Livros cadastrados:');
    console.table(livros);
  } else {
    console.log('\n📚 Nenhum livro cadastrado.\n');
  }
}

async function adicionarLivro() {
  console.log('\n➕ ADICIONAR LIVRO\n');
  const titulo = await pergunta('Título: ');
  const autor = await pergunta('Autor: ');
  const ano_lancamento = await pergunta('Ano de lançamento: ');
  try {
    await db('livros').insert({ titulo, autor, ano_lancamento, status: 'disponivel' });
    console.log('\n✅ Livro adicionado!\n');
  } catch (error: any) {
    console.log('\n❌ Erro:', error.message);
  }
}

async function atualizarLivro() {
  await listarLivros();
  console.log('\n✏️  ATUALIZAR LIVRO\n');
  const id = await pergunta('ID: ');
  const titulo = await pergunta('Título: ');
  const autor = await pergunta('Autor: ');
  const ano_lancamento = await pergunta('Ano: ');
  try {
    const result = await db('livros').where({ id }).update({ titulo, autor, ano_lancamento });
    console.log(result > 0 ? '\n✅ Atualizado!\n' : '\n❌ Não encontrado!\n');
  } catch (error: any) {
    console.log('\n❌ Erro:', error.message);
  }
}

async function deletarLivro() {
  await listarLivros();
  console.log('\n🗑️  DELETAR LIVRO\n');
  const id = await pergunta('ID: ');
  const conf = await pergunta('Confirma? (s/n): ');
  if (conf.toLowerCase() === 's') {
    const result = await db('livros').where({ id }).delete();
    console.log(result > 0 ? '\n✅ Deletado!\n' : '\n❌ Não encontrado!\n');
  } else {
    console.log('\n❌ Cancelado.\n');
  }
}

// ========== ALUGUEIS ==========
async function alugarLivro() {
  await listarUsuarios();
  await listarLivros();
  console.log('\n📖 ALUGAR LIVRO\n');
  const usuario_id = await pergunta('ID do usuário: ');
  const livro_id = await pergunta('ID do livro: ');
  try {
    const livro = await db('livros').where({ id: livro_id }).first();
    if (!livro) {
      console.log('\n❌ Livro não encontrado!\n');
      return;
    }
    if (livro.status === 'alugado') {
      console.log('\n❌ Livro já está alugado!\n');
      return;
    }
    await db('alugueis').insert({ usuario_id, livro_id });
    await db('livros').where({ id: livro_id }).update({ status: 'alugado' });
    console.log('\n✅ Livro alugado com sucesso!\n');
  } catch (error: any) {
    console.log('\n❌ Erro:', error.message);
  }
}

async function devolverLivro() {
  const alugueis = await db('alugueis')
    .join('usuarios', 'alugueis.usuario_id', 'usuarios.id')
    .join('livros', 'alugueis.livro_id', 'livros.id')
    .where('alugueis.data_devolucao', null)
    .select('alugueis.id', 'usuarios.nome as usuario', 'livros.titulo', 'alugueis.data_aluguel');
  if (alugueis.length === 0) {
    console.log('\n📖 Nenhum livro alugado no momento.\n');
    return;
  }
  console.log('\n📖 Livros alugados:');
  console.table(alugueis);
  console.log('\n📥 DEVOLVER LIVRO\n');
  const id = await pergunta('ID do aluguel: ');
  try {
    const aluguel = await db('alugueis').where({ id }).first();
    if (!aluguel) {
      console.log('\n❌ Aluguel não encontrado!\n');
      return;
    }
    await db('alugueis').where({ id }).update({ data_devolucao: db.fn.now() });
    await db('livros').where({ id: aluguel.livro_id }).update({ status: 'disponivel' });
    console.log('\n✅ Livro devolvido!\n');
  } catch (error: any) {
    console.log('\n❌ Erro:', error.message);
  }
}

async function listarAlugueis() {
  const alugueis = await db('alugueis')
    .join('usuarios', 'alugueis.usuario_id', 'usuarios.id')
    .join('livros', 'alugueis.livro_id', 'livros.id')
    .select('alugueis.id', 'usuarios.nome as usuario', 'livros.titulo', 'alugueis.data_aluguel', 'alugueis.data_devolucao');
  if (alugueis.length > 0) {
    console.log('\n📋 Histórico de alugueis:');
    console.table(alugueis);
  } else {
    console.log('\n📋 Nenhum aluguel registrado.\n');
  }
}

// ========== MENUS ==========
async function menuUsuarios(): Promise<void> {
  console.log('\n═══════════════════════════════════\n       GERENCIAR USUÁRIOS\n═══════════════════════════════════\n1 - Listar\n2 - Adicionar\n3 - Atualizar\n4 - Deletar\n5 - Voltar\n═══════════════════════════════════\n');
  const op = await pergunta('Opção: ');
  switch (op) {
    case '1': await listarUsuarios(); await menuUsuarios(); break;
    case '2': await adicionarUsuario(); await menuUsuarios(); break;
    case '3': await atualizarUsuario(); await menuUsuarios(); break;
    case '4': await deletarUsuario(); await menuUsuarios(); break;
    case '5': await mostrarMenu(); break;
    default: console.log('\n❌ Opção inválida!\n'); await menuUsuarios();
  }
}

async function menuLivros(): Promise<void> {
  console.log('\n═══════════════════════════════════\n        GERENCIAR LIVROS\n═══════════════════════════════════\n1 - Listar\n2 - Adicionar\n3 - Atualizar\n4 - Deletar\n5 - Voltar\n═══════════════════════════════════\n');
  const op = await pergunta('Opção: ');
  switch (op) {
    case '1': await listarLivros(); await menuLivros(); break;
    case '2': await adicionarLivro(); await menuLivros(); break;
    case '3': await atualizarLivro(); await menuLivros(); break;
    case '4': await deletarLivro(); await menuLivros(); break;
    case '5': await mostrarMenu(); break;
    default: console.log('\n❌ Opção inválida!\n'); await menuLivros();
  }
}

async function menuAlugueis(): Promise<void> {
  console.log('\n═══════════════════════════════════\n        GERENCIAR ALUGUEIS\n═══════════════════════════════════\n1 - Alugar livro\n2 - Devolver livro\n3 - Listar alugueis\n4 - Voltar\n═══════════════════════════════════\n');
  const op = await pergunta('Opção: ');
  switch (op) {
    case '1': await alugarLivro(); await menuAlugueis(); break;
    case '2': await devolverLivro(); await menuAlugueis(); break;
    case '3': await listarAlugueis(); await menuAlugueis(); break;
    case '4': await mostrarMenu(); break;
    default: console.log('\n❌ Opção inválida!\n'); await menuAlugueis();
  }
}

async function mostrarMenu(): Promise<void> {
  console.log('\n═══════════════════════════════════\n    📚 SISTEMA DE BIBLIOTECA 📚\n═══════════════════════════════════\n1 - Gerenciar Usuários\n2 - Gerenciar Livros\n3 - Gerenciar Alugueis\n4 - Sair\n═══════════════════════════════════\n');
  const op = await pergunta('Opção: ');
  switch (op) {
    case '1': await menuUsuarios(); break;
    case '2': await menuLivros(); break;
    case '3': await menuAlugueis(); break;
    case '4': console.log('\n👋 Encerrando...\n'); rl.close(); await db.destroy(); process.exit(0); break;
    default: console.log('\n❌ Opção inválida!\n'); await mostrarMenu();
  }
}

async function main() {
  console.log('🚀 Iniciando sistema...\n');
  try {
    await db.raw('SELECT 1');
    console.log('✅ Conectado ao banco!\n');
    await mostrarMenu();
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
    console.log('\n💡 Dica: Execute "npm run bd" primeiro!\n');
    rl.close(); await db.destroy(); process.exit(1);
  }
}
main();
