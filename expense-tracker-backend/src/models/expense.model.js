const { experimentNameAutocorrect } = require("firebase-tools/lib/experiments");
const db = require("../config/db");

exports.createExpense = async (data) => {
  const { userId, categoryId, title, description, amount, expenseDate } = data;

  console.log('Creating expense with data:', data); // Debugging line

  const [result] = await db.execute(
    `INSERT INTO expenses 
     (user_id, category_id, title, description, amount, expense_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      categoryId,
      title,
      description ?? null,   // ✅ IMPORTANT LINE
      amount,
      expenseDate
    ]
  );

  return result.insertId;
};

exports.getExpensesByUser = async (userId, from, to, limit = 50, offset = 0) => {
  limit = Number(limit);
  offset = Number(offset);

  let query = `
    SELECT 
      e.id, 
      e.title, 
      e.description,
      e.amount, 
      e.expense_date, 
      c.name AS category
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
  `;

  let params = [userId];

  if (from) {
    query += " AND e.expense_date >= ?";
    params.push(from);
  }

  if (to) {
    query += " AND e.expense_date <= ?";
    params.push(to);
  }

  // 🚨 IMPORTANT FIX
  query += ` ORDER BY e.expense_date DESC LIMIT ${offset}, ${limit}`;

  console.log("FINAL QUERY:", query);
  console.log("PARAMS:", params);

  const [rows] = await db.execute(query, params);
  return rows;
};


exports.deleteExpense = async (id, userId) => {
  const [result] = await db.execute(
    "DELETE FROM expenses WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return result.affectedRows;
};

exports.update = async(expenseId,data) => {
  const fields = [] ;
  const values = [] ;

  if( data.title ){
    fields.push("title = ? ") ;
    values.push(data.title) ;
  } 

  if( data.description != undefined ){
    fields.push("description = ?") ;
    values.push(data.description ?? null) ;
  }

  if( data.amount ){
    fields.push("amount = ?") ;
    values.push(data.amount) ;
  }

  if( data.category){
    fields.push("category_id = ?") ;
    values.push(data.category) ;
  }

  if( data.expenseDate ){
    fields.push("expense_date = ?");
    values.push(data.expenseDate) ;
  }

  if( fields.length == 0 ){
    throw new Error("No fields to update") ;
  }

  const query = `
    UPDATE expenses
    SET ${fields.join(", ")}
    WHERE id = ?
    ` ;
  
    values.push(expenseId);

    const [result] = await db.execute(query,values) ;

    return result.affectedRows ;

}

exports.findById = async (expenseId) => {
  const [rows] = await db.execute(
    "SELECT * FROM expenses WHERE id = ?" , [expenseId]
  ) ;

  return rows[0] ;
}


exports.getMonthlyTotal = async(userId, month , year) => {
  const [rows] = await db.execute(
    `\
    SELECT SUM(amount) AS totalAmount 
    FROM expenses
    WHERE user_id = ? 
      AND MONTH(expense_date) = ? 
      AND YEAR(expense_date) = ? 
    ` ,
    [userId, month, year ]
    
  ) ;

  return rows[0].totalAmount ;
}

exports.getCategoryBreakDown = async(userId, month, year ) => {

  const [rows] = await db.execute(
    `
    SELECT 
      c.name as category,
      SUM(e.amount) AS total
    FROM expenses e 
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ? 
      AND MONTH(e.expense_date) = ? 
      AND YEAR(e.expense_date) = ? 
    GROUP BY c.name
  `,

  [userId , month, year] 
  ) ;

  return rows ;
}

exports.countExpenses = async ( userId, from , to ) => {

  let query = `
    SELECT COUNT(*) AS total 
    FROM expenses
    WHERE user_id = ? ` ;
  
  const values = [userId] ;

  if( from ){
    query += " AND expense_date >= ? " ;
    values.push(from) ;
  }

  if( to ){
    query += "AND expense_date <= ? ";
    values.push(to) ;
  }

  const [rows] = await db.execute(query,values) ;

  return rows[0].total ;

};


