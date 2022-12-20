import { Database } from 'sqlite3';

const db = new Database('Database');

db.run("CREATE TABLE user(id integer primary key, pw integar not null)");

// insert into the user table
db.run("INSERT INTO user(id, pw) VALUES('tj', 'foobar')", function (err) {
    if (err) {
        return console.log(err.message);
    }
    // get the last insert id
    console.log(`A row has been inserted with rowid ${this.lastID}`);
});

db.close();

