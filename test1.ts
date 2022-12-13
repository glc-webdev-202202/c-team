const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database("./stock.db", sqlite3, () => {});

const sql = `INSERT INTO stock (stock_code, stock_name, stock_price, stock_ud) VALUES(?,?,?,?)`;

function readStock(row : any) {
    db.serialize(() => {
    db.all("SELECT stock_name,stock_price FROM stock", () => {
        console.log(row.stock_name + ":" + row.stock_price);});
        db.close((err: any) => {
            if (err) return console.error(err.message);
        });
    })
};

function closeDb() {
    console.log("closeDb");
    db.close();
}
