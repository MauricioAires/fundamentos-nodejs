const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();

app.use(express.json());

/**
 *
 * NOTE: TIPOS DE MÉTODOS
 * GET - Buscar
 * POST - Inserir
 * PUT - Alterar
 * PATCH - Alterar uma informação especifica
 * DELETE - Apagar
 */

/**
 * NOTE: TIPOS DE PARÂMETROS
 * Route Params => na url, definido pelas barras
 * Query Params =>
 * Body Params =>
 */

/**
 * NOTE: MIDDLEWARE
 *
 */

/**
 * cpf string
 * name string
 * id uuid
 * statement []
 */

const customers = [];

// Middlware

function verifyIfExistsAccountCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((c) => c.cpf == cpf);

  if (!customer) {
    res.status(400).json({
      message: "Customer not found",
    });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    }

    if (operation.type === "debit") {
      return acc - operation.amount;
    }

    return acc;
  }, 0);

  return balance;
}

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;
  const id = uuidV4();

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    res.status(400).json({
      message: "CPF already exists",
    });
  }

  customers.push({
    cpf,
    name,
    id,
    statement: [],
  });

  return res.status(201).send();
});

// NOTE: todas as rotas abaixo do app use vai passar por esse middleware
// app.use(verifyIfExistsAccountCPF);

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter((statement) => {
    // console.log(new Date(statement.created_at).toDateString());
    return (
      new Date(statement.created_at).toDateString() ==
      new Date(dateFormat).toDateString()
    );
  });

  return res.json(statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { description, amount } = req.body;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { amount } = req.body;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({
      message: "Insufficient funds!",
    });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.listen(3333, () => console.log("server listening on 3333"));
