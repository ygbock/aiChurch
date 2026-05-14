const fs = require('fs');
const path = require('path');

const blueprintPath = path.join(__dirname, 'firebase-blueprint.json');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

blueprint.entities.AccountingAccount = {
  title: "Accounting Account",
  description: "A chart of accounts entry.",
  type: "object",
  properties: {
    code: { type: "string" },
    name: { type: "string" },
    category: { type: "string" },
    isActive: { type: "boolean" },
    parentAccountId: { type: "string" },
    branchId: { type: "string" },
    updatedAt: { type: "string" }
  },
  required: ["code", "name", "category", "isActive", "branchId"]
};

blueprint.entities.AccountingFund = {
  title: "Accounting Fund",
  description: "A fund for accounting.",
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    isRestricted: { type: "boolean" },
    balanceLimit: { type: "number" },
    branchId: { type: "string" },
    updatedAt: { type: "string" }
  },
  required: ["name", "description", "isRestricted", "branchId"]
};

blueprint.entities.JournalEntry = {
  title: "Journal Entry",
  description: "A journal entry.",
  type: "object",
  properties: {
    entryDate: { type: "string" },
    description: { type: "string" },
    status: { type: "string", enum: ["Draft", "Pending Approval", "Posted", "Reversed"] },
    fundId: { type: "string" },
    branchId: { type: "string" },
    reference: { type: "string" },
    attachments: { type: "array", items: { type: "string" } },
    createdBy: { type: "string" },
    createdAt: { type: "string" },
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          accountId: { type: "string" },
          debit: { type: "number" },
          credit: { type: "number" }
        }
      }
    }
  },
  required: ["entryDate", "description", "status", "fundId", "branchId", "createdBy", "createdAt", "lines"]
};

blueprint.entities.AccountingBudget = {
  title: "Accounting Budget",
  description: "A monthly or quarterly budget.",
  type: "object",
  properties: {
    name: { type: "string" },
    periodStart: { type: "string" },
    periodEnd: { type: "string" },
    branchId: { type: "string" },
    accountId: { type: "string" },
    amount: { type: "number" },
    createdAt: { type: "string" }
  },
  required: ["name", "periodStart", "periodEnd", "branchId", "accountId", "amount"]
};

blueprint.firestore["/districts/{districtId}/branches/{branchId}/accountingAccounts/{accountId}"] = {
  schema: "AccountingAccount",
  description: "Accounts scoped by branch."
};

blueprint.firestore["/districts/{districtId}/branches/{branchId}/accountingFunds/{fundId}"] = {
  schema: "AccountingFund",
  description: "Funds scoped by branch."
};

blueprint.firestore["/districts/{districtId}/branches/{branchId}/journalEntries/{journalId}"] = {
  schema: "JournalEntry",
  description: "Journal entries scoped by branch."
};

blueprint.firestore["/districts/{districtId}/branches/{branchId}/accountingBudgets/{budgetId}"] = {
  schema: "AccountingBudget",
  description: "Budgets scoped by branch."
};

fs.writeFileSync(blueprintPath, JSON.stringify(blueprint, null, 2));
console.log('Updated firebase-blueprint.json');
