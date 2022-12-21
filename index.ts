import express, { NextFunction, Request, Response } from "express";
import session from "express-session";
import path from "path";

const sqlite = require("sqlite3").verbose();

class User {
    public id: string;
    public pw: string;

    public constructor(id: string, pw: string){
        this.id = id;
        this.pw = pw;
    }
}

// class User {
//     public name: string;

//     public password: string;

//     public constructor(name: string, password: string) {
//         this.name = name;
//         this.password = password;
//     }
// }

class Article {
    public title: string;
    public contents: string;

    public constructor(title: string, contents: string) {
        this.title = title;
        this.contents = contents;
    }
}

// class Article {
//     public name: string;

//     public title: string;
//     public contents: string;

//     public constructor(name: string, title: string, contents: string) {
//         this.name = name;
//         this.title = title;
//         this.contents = contents;
//     }
// }

class Diary {
    public d_id: number;
    public d_pw: number;
    public d_title: string;
    public d_contents: string;

    public constructor(d_id: number, d_pw: number, d_title: string, d_contents: string) {
        this.d_id = d_id;
        this.d_pw = d_pw;
        this.d_title = d_title;
        this.d_contents = d_contents;
    }
}

class AuthDatabase {
    public db = new sqlite.Database('database.db', sqlite.OPEN_READWRITE, (err: any) => {
        if (err) {
          //console.error(err.message);
          console.log("Error Occurred - " + err.message);
        }
    });

    // public article = new db.Database('article.db', db.OPEN_READWRITE, (err: any) => {
    //     if (err) {
    //       console.error(err.message);
    //     }
    // });

    // public diary = new db.Database('diary.db', db.OPEN_READWRITE, (err: any) => {
    //     if (err) {
    //       console.error(err.message);
    //     }
    // });

    constructor(){
        this.createUserTable();
        this.createArticleTable();
        this.createDiaryTable();
    }

    public createUserTable(): void {
        this.db.run("CREATE TABLE IF NOT EXISTS user(id varchar(16) PRIMARY KEY, pw TEXT NOT NULL)")
    }

    public createArticleTable(): void {
        this.db.run("CREATE TABLE IF NOT EXISTS article(articleid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title TEXT, contents TEXT)");
    }

    public createDiaryTable(): void {
        this.db.run("CREATE TABLE IF NOT EXISTS diary(d_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, d_pw INTEGER NOT NULL, d_title TEXT, d_contents TEXT)")
    }

}

class AuthRepository {
    public authDatabase = new AuthDatabase();

    // public users: User[] = [
    //     { name: 'tj', password: 'foobar' },
    //     { name: 'bj', password: 'pass' },
    //     { name: 'kj', password: 'word' },
    //     { name: 'ts', password: 'ts' },
    //     { name: 'tl', password: 'tl' },
    // ];

    // public findUser(name: string): User | null {
    //     var user = this.users.find(user => user.name === name);
    //     if (!user) return null;
    //     else return user;
    // }

    public findUser(id: string, fn:(user: User | null) => void){
        this.authDatabase.db.get(`SELECT id, pw FROM user WHERE id="${id}"`, (err: any, row: any) => {
            if (!row){
                fn(null);
            } else {
                fn({"id": row.id, "pw": row.pw});
            }
        })
    }
}

class AuthService {
    public authRepository = new AuthRepository();

    // public async authenticate(name: string, pass: string, fn: (user: User | null) => void) {
    //     var user = this.authRepository.findUser(name);
    //     if (!user) return fn(null);
    //     if (pass === user.password) return fn(user);
    //     fn(null);
    // }

    public async authenticate(id: string, pw: string, fn: (user: User | null) => void){
        this.authRepository.findUser(id, (user) =>{
            if (!user) return fn(null);
            if (pw === user.pw) return fn(user);
            fn(null);
        });
    }
}

class ForumRepository {
    public authDatabase = new AuthDatabase();

    // private bbs: Article[] = [
    //     { name: 'tj', title: 'hello', contents: 'nice to meet you' },
    //     { name: 'bj', title: 'I\'m new here', contents: 'yoroshiku' },
    //     { name: 'tj', title: 'here again!', contents: 'anybody here?' },
    //     { name: 'ts', title: 'rich people', contents: 'money ain\'t an issue' },
    // ];

    // public listBbs = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    //     try {
    //         res.render('bbs', { list: this.bbs ,loggedin: req.session.user});
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    public listBbs(callback:any){
        this.authDatabase.db.all("SELECT * FROM article", function(err:any, row:any){
            callback(row);
        });
    }

    // public writeBbs = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    //     try {
    //         if (!req.session.user) {
    //             res.redirect("login");
    //         } else {
    //             this.bbs.push({ name: req.session.user.name, title: req.body.title, contents: req.body.contents })
    //             res.redirect("/bbs")
    //         }
    //     }
    //     catch (error) {
    //         next(error);
    //     }
    // }

    public addBbs2Db(title: string, contents: string, fn: (article: Article | null) => void){
        this.authDatabase.db.run(`INSERT INTO article (title, contents) VALUES ("${title}", "${contents}")`, (err: any) => {
            if (err){
                fn(null);
            } else {
                fn({"title": title, "contents": contents});
            }
        })
    }

    
    // public getMyBbs(name:string): Article[] {
    //     return this.bbs.filter((article:Article) => article.name == name);
    // }


    // public async myBbs(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         if (!req.session.user){
    //             res.redirect("login");
    //         } else {
    //             res.render('mybbs', {
    //                 list: this.getMyBbs,
    //                 loggedin: req.session.user
    //             }); 
    //         }
    //     } catch (error) {
    //         next(error);
    //     }
    // }
}

declare module 'express-session' {
    interface SessionData {
        user: User;
        error: string;
        success: string;
    }
}

class AuthController {
    public authDatabase = new AuthDatabase();
    public authService = new AuthService();
    public forumRepository = new ForumRepository();

    public index = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('main', { loggedin: req.session.user }); //main.ejs 메인(홈 화면) 접속
        } catch (error) {
            next(error);
        }
    };

    //Login관련 기능

    //signup Render
    public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('login', { loggedin: req.session.user });
        } catch (error) {
            next(error);
        }
    };

    //Login existing User
    // public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    //     try {
    //         await this.authService.authenticate(req.body.username, req.body.password, function (user) {
    //             if (user) {
    //                 req.session.regenerate(function () {
    //                     req.session.user = user;
    //                     req.session.success = 'username: ' + user.name;
    //                     res.redirect('/');
    //                 });
    //             } else {
    //                 req.session.error = '비밀번호가 틀렸습니다. '
    //                     + ' (use "tj" and "foobar")';
    //                 res.redirect('/');
    //             }
    //         });
    //     } catch (error) {
    //         next(error);
    //     }
    // };

    public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
        try {
            await this.authService.authenticate(req.body.id, req.body.pw, function (user) {
                if (user) {
                    req.session.regenerate(function () {
                        req.session.user = user;
                        res.redirect('/');
                        req.session.success = 'Logged in as ' + user.id;
                    });
                } else {
                    req.session.error = 'Please check your username and password.';
                    res.redirect('/login');
                }
            });
        } catch (error) {
            next(error);
        }
    }

    //Logout existing user
    public logOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.session.destroy(function () {
                res.redirect('/');
            });
        } catch (error) {
            next(error);
        }
    };

    public restricted = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (req.session.user) {
                res.render("restricted");
            } else {
                req.session.error = '접근 금지!';
                res.redirect('/');
            }

        } catch (error) {
            next(error);
        }
    };

    //render register
    public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('register');
        } catch (error) {
            next(error);
        }
    };

    //Add new user
    // public addnewuser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        
    //     try {

    //         if (User.name === req.body.newusername) {
    //             req.session.error = '이미 있는 계정입니다.';
    //             res.redirect('/');
    //         } else {
    //             this.authService.authRepository.users.push({name: req.body.newusername, password: req.body.newpassword});
    //             res.render('register', {message: '회원가입 성공.'});
    //             res.redirect('/');
    //         }
       
    //     } catch (error) {
    //         next(error);
    //     }
    // };

    public addnewuser(req: Request, res: Response, next: NextFunction, id: string, pw: string, fn: (user: User | null) => void){
        this.authDatabase.db.run(`INSERT INTO user (id, pw) VALUES ("${id}", "${pw}"`, (err: any) => {
            if (err){
                fn(null);
            } else {
                fn({"id": id, "pw": pw});
            }
        })
    }

    //Diary 관련 기능
    public diary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('diary');
        } catch (error) {
            next(error);
        }
    };

}

class App {
    public app: express.Application;
    public authController;
    constructor() {
        this.app = express();
        this.authController = new AuthController();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    public listen(port: number) {
        this.app.listen(port);
    }
    private initializeMiddlewares() {
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, 'views'));

        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: 'asdf!@#$qwer'
        }));
        this.app.use(function (req: Request, res: Response, next) {
            var err = req.session.error;
            var msg = req.session.success;
            delete req.session.error;
            delete req.session.success;
            res.locals.message = '';
            if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
            if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
            next();
        });
    }

    private initializeRoutes() {
        this.app.get('/', this.authController.index);
        this.app.get('/login', this.authController.signUp);
        this.app.post('/login', this.authController.logIn);
        this.app.get('/restricted', this.authController.restricted);
        this.app.get('/logout', this.authController.logOut);
        this.app.get('/bbs', this.authController.forumRepository.listBbs);
        // this.app.post('/write', this.authController.forumRepository.writeBbs);
        // this.app.get('/myBbs', this.authController.forumRepository.myBbs);
        this.app.get('/register', this.authController.register);
        // this.app.post('/register', this.authController.addnewuser);
        this.app.get('/diary', this.authController.diary); //일기장 화면 
    }
}

const app = new App(); //

app.listen(8080)
