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

class Article {
    public title: string;
    public contents: string;

    public constructor(title: string, contents: string) {
        this.title = title;
        this.contents = contents;
    }
}


class Diary {
    public d_pw: number;
    public d_title: string;
    public d_contents: string;

    public constructor(d_pw: number, d_title: string, d_contents: string) {
        this.d_pw = d_pw;
        this.d_title = d_title;
        this.d_contents = d_contents;
    }
}

class AuthRepository {

    //opens and read database file
    public db = new sqlite.Database("database.db", sqlite.OPEN_READWRITE, (err: any) => {
        if (err) {
            console.log("Error Occurred - " + err.message);
        }
    });

    // create User,Article,Diary Schema in DB
    public createTable(): void {
        this.db.serialize(() => {
            this.db.run("CREATE TABLE IF NOT EXISTS user(id varchar(16) PRIMARY KEY, pw TEXT NOT NULL)")
            this.db.run("CREATE TABLE IF NOT EXISTS article(articleid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title TEXT, contents TEXT)");
            this.db.run("CREATE TABLE IF NOT EXISTS diary(d_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, d_pw INTEGER NOT NULL, d_title TEXT, d_contents TEXT)")
        })
    }

    constructor(){
        this.createTable();
    }

    //select id tuple from user table
    public findUser(id: string, fn:(user: User | null) => void){
        this.db.get(`SELECT id, pw FROM user WHERE id="${id}"`, (err: any, row: any) => {
            if (!row){
                fn(null);
            } else {
                fn({"id": row.id, "pw": row.pw});
            }
        })
    }

    //Add new user
    public addnewuser(id: string, pw: string, fn: (user: User | null) => void){
        this.db.run(`INSERT INTO user (id, pw) VALUES ("${id}", "${pw}")`, (err: any) => {
            if (err){
                fn(null);
            } else {
                fn({"id": id, "pw": pw});
            }
        })
    }

    public getBbs(callback:any){
        this.db.all("SELECT * FROM article", function(err:any, row:any){
            callback(row);
        });
    }

    //Same function as writeBbs | Adds new bbs to table
    public addBbs(title: string, contents: string, fn: (article: Article | null) => void){
        this.db.run(`INSERT INTO article (title, contents) VALUES ("${title}", "${contents}")`, (err: any) => {
            if (err){
                fn(null);
            } else {
                fn({"title": title, "contents": contents});
            }
        })
    }

    // public myBbs(){

    // }

    public listmyBbs(id: string, callback:any){
        this.db.all("SELECT title, content FROM article WHERE id in (SELECT id FROM article WHERE id='${id}')", function(err:any, row:any){
            callback(row);
        });
    }

    public addDiary(d_pw: number, d_title: string, d_contents: string, fn:(diary: Diary | null) => void ) {
        this.db.run(`INSERT INTO diary (d_pw, d_title, d_contents) VALUES ("${d_pw}", "${d_title}", "${d_contents}")`, (err: any) => {
            if (err){
                fn(null);
            } else {
                fn({"d_pw": d_pw, "d_title": d_title, "d_contents": d_contents});

            }
        })
    }

    public myDiary(callback:any) {
        this.db.all("SELECT * FROM diary", function(err:any, row:any){
            callback(row)
        });
    }


}

class AuthService {
    public authRepository = new AuthRepository();

    public async authenticate(id: string, pw: string, fn: (user: User | null) => void){
        this.authRepository.findUser(id, (user) =>{
            if (!user) return fn(null);
            if (pw === user.pw) return fn(user);
            fn(null);
        });
    }
}

declare module "express-session" {
    interface SessionData {
        user: User;
        error: string;
        success: string;
    }
}

class AuthController {
    public authService = new AuthService();
    public authRepository = new AuthRepository();

    //?????? ????????? Render
    public index = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render("main", { loggedin: req.session.user }); //main.ejs ??????(??? ??????) ??????
        } catch (error) {
            next(error);
        }
    };

    //Login?????? ??????

    //signup Render
    public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render("login", { loggedin: req.session.user });
        } catch (error) {
            next(error);
        }
    };

    //Login existing User
    public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.authService.authenticate(req.body.id, req.body.pw, function (user) {
                if (user) {
                    req.session.regenerate(function () {
                        req.session.user = user;
                        res.redirect("/");
                        req.session.success = "Logged in as " + user.id;
                    });
                } else {
                    req.session.error = "Please check your username and password.";
                    res.redirect("/login");
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
                res.redirect("/");
            });
        } catch (error) {
            next(error);
        }
    };

    public restricted = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (req.session.user) {
                res.render("restricted");
            }
        } catch (error) {
            next(error);
        }
    };

    //render register
    public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render("register");
        } catch (error) {
            next(error);
        }
    };

    public registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {id, pw} = req.body;
            this.authRepository.findUser(id, (user) => {
                if (user){
                    req.session.error = "Username already taken";
                    res.redirect("/register");
                } else {
                    this.authRepository.addnewuser(id, pw, (user) => {
                        if (user){
                            req.session.user = user;
                            req.session.success = "Welcome new user, " + user.id + ". Please login.";
                            res.redirect("/login");
                        } else {
                            req.session.error = "Registration failed";
                            res.redirect("/register");
                        }
                    });
                }
            });
        } catch (error) {
            next(error);
        }

    }

    public postBbs = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {title, contents} = req.body;
            if (req.session.user){
                this.authRepository.addBbs(title, contents, (article) => {
                    if (article){
                        res.redirect("/bbs");
                    } else {
                        res.redirect("/bbs");
                    }
                });
            } else {
                req.session.error = "?????? ??????";
                res.redirect("/login");
            }
        } catch (error) {
            next(error);
        }
    }

    public listBbs = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (req.session.user){
                this.authService.authRepository.getBbs(function(result:any){
                    res.render("bbs", {loggedin: req.session.user, article: result});
                });
            } else {
                req.session.error = "?????? ??????";
                res.redirect("/restricted");
            }

        } catch (error) {
            next(error);
        }
    }
    public mylistBbs = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                if (req.session.user){
                    this.authService.authRepository.listmyBbs(req.session.user.id, function(result:any){
                        res.render("myBbs", {loggedin: req.session.user, articles:result});
                    });
                } else{
                    req.session.error = "PLease Login";
                    res.redirect("/login");
                }
            } catch (error) {
                next(error);
            }
    };

    //Diary ?????? ??????
    public diarylist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('diarylist', {loggedin: req.session.user});
        } catch (error) {
            next(error);
        }
    };

    public diarywrite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('diaryWrite', {loggedin: req.session.user});
        } catch (error) {
            next(error);
        }
    };

    public mydiaries = async(req: Request, res: Response, next: NextFunction): Promise<void> => {  
        try {
            if (req.session.user){
                this.authService.authRepository.myDiary(function(result:any){
                    res.render('diarylist', {loggedin: req.session.user, diary:result});
                });
            } else{
                req.session.error = 'PLease Login';
                res.redirect('/login');
            }
        } catch (error) {
            next(error);
        }
    };

    public diaryCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {

        } catch (error) {
            next(error);
        }
    };

    // public writeDiary = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    //     try {
    //         const {pw, title, contents} = req.body;
    //         if (req.session.user){
    //             this.authRepository.addDiary(d_pw, d_title, d_contents, (diary) => {
    //                 if (diary){
    //                     res.redirect('/diarylist');
    //                 } else {
    //                     res.redirect('/diarylist');
    //                 }
    //             });
    //         } else {
    //             req.session.error = '?????? ??????';
    //             res.redirect('/login');
    //         }
    //     } catch (error) {
    //         next(error);
    //     }
    // }
    

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
        this.app.set("view engine", "ejs");
        this.app.set("views", path.join(__dirname, "views"));

        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: "asdf!@#$qwer"
        }));
        this.app.use(function (req: Request, res: Response, next) {
            var err = req.session.error;
            var msg = req.session.success;
            delete req.session.error;
            delete req.session.success;
            res.locals.message = "";
            if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
            if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
            next();
        });
    }

    private initializeRoutes() {

        //get
        this.app.get("/", this.authController.index); //?????? ??????
        this.app.get("/login", this.authController.signUp); //????????? ??????
        this.app.get("/logout", this.authController.logOut); //???????????? ??????
        this.app.get("/restricted", this.authController.restricted); //???????????? ??????
        this.app.get("/register", this.authController.register); //???????????? ??????

        this.app.get('/bbs', this.authController.listBbs); //bbs ?????? + ?????? ???
        this.app.get('/myBbs', this.authController.mylistBbs); //myBbs ?????? + ??? ???

        this.app.get('/diarylist', this.authController.mydiaries); //????????? ?????? + ??? ??????
        this.app.get('/diarywrite', this.authController.diarywrite); //????????? ?????? ??????


        //post
        this.app.post('/login', this.authController.logIn); // 
        this.app.post('/register', this.authController.registerUser); //???????????? ????????? ??????
        this.app.post('/postBbs', this.authController.postBbs); //???????????? ??? ??????

    }
}

const app = new App(); //

app.listen(8080)
