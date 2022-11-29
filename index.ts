import express, { NextFunction, Request, Response } from "express";
import session from "express-session";
import path from "path";

class Article {
    public name: string;

    public title: string;
    public contents: string;

    public constructor(name: string, title: string, contents: string) {
        this.name = name;
        this.title = title;
        this.contents = contents;
    }
}

class ForumRepository {
    private bbs: Article[] = [
        { name: 'tj', title: 'hello', contents: 'nice to meet you' },
        { name: 'bj', title: 'I\'m new here', contents: 'yoroshiku' },
        { name: 'tj', title: 'here again!', contents: 'anybody here?' },
        { name: 'ts', title: 'rich people', contents: 'money ain\'t an issue' },
    ];

    public listBbs = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('bbs', { list: this.bbs });
        } catch (error) {
            next(error);
        }
    }

    public writeBbs = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.session.user) {
                res.redirect("login");
            } else {
                this.bbs.push({ name: req.session.user.name, title: req.body.title, contents: req.body.contents })
                res.redirect("/bbs")
            }
        }
        catch (error) {
            next(error);
        }
    }
    
    public getMyBbs(name:string): Article[] {
        return this.bbs.filter((article:Article) => article.name == name);
    }


    public async myBbs(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.session.user){
                res.redirect("login");
            } else {
                res.render('mybbs', {
                    list: this.getMyBbs,
                    loggedin: req.session.user
                }); 
            }
        } catch (error) {
            next(error);
        }
    }
}

// const bbs: Article[] = [
//     { name: 'tj', title: 'hello', contents: 'nice to meet you' },
//     { name: 'bj', title: 'I\'m new here', contents: 'yoroshiku' },
//     { name: 'tj', title: 'here again!', contents: 'anybody here?' },
//     { name: 'ts', title: 'rich people', contents: 'money ain\'t an issue' },
// ];

// function listBbs(req: Request, res: Response, next: NextFunction): void {
//     try {
//         res.render('bbs', { list: bbs });
//     } catch (error) {
//         next(error);
//     }
// };

// function writeBbs(req: Request, res: Response, next: NextFunction) {
//     try {
//         if (!req.session.user) {
//             res.redirect("login");
//         } else {
//             bbs.push({ name: req.session.user.name, title: req.body.title, contents: req.body.contents })
//             res.redirect("/bbs")
//         }
//     }
//     catch (error) {
//         next(error);
//     }
// }

// function sortBbs(req: Request, res: Response, next: NextFunction) {

//     // var myPosts =  bbs.filter(function(Post) {
//     //     return post.name == req.session.user?.name;
//     // });
    
//     try {
//         if (!req.session.user) {
//             res.redirect("login");
//         } else {
//             bbs.filter()
//             res.redirect("/bbs")
//         }
//     }
//     catch (error) {
//         next(error);
//     }
// }

class User {
    public name: string;

    public password: string;

    public constructor(name: string, password: string) {
        this.name = name;
        this.password = password;
    }
}

declare module 'express-session' {
    interface SessionData {
        user: User;
        error: string;
        success: string;
    }
}

class AuthRepository {
    public users: User[] = [
        { name: 'tj', password: 'foobar' },
        { name: 'bj', password: 'pass' },
        { name: 'kj', password: 'word' },
        { name: 'ts', password: 'ts' },
        { name: 'tl', password: 'tl' },
    ];

    public findUser(name: string): User | null {
        var user = this.users.find(user => user.name === name);
        if (!user) return null;
        else return user;
    }
}

class AuthService {
    public authRepository = new AuthRepository();

    public async authenticate(name: string, pass: string, fn: (user: User | null) => void) {
        var user = this.authRepository.findUser(name);
        if (!user) return fn(null);
        if (pass === user.password) return fn(user);
        fn(null);
    }
}

class AuthController {
    public authService = new AuthService();
    public forumRepository = new ForumRepository();

    public index = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.redirect('/login');
        } catch (error) {
            next(error);
        }
    };

    public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('login', { loggedin: req.session.user });
        } catch (error) {
            next(error);
        }
    };

    public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.authService.authenticate(req.body.username, req.body.password, function (user) {
                if (user) {
                    req.session.regenerate(function () {
                        req.session.user = user;
                        req.session.success = 'username: ' + user.name;
                        res.redirect('back');
                    });
                } else {
                    req.session.error = '비밀번호가 틀렸습니다. '
                        + ' (use "tj" and "foobar")';
                    res.redirect('/');
                }
            });
        } catch (error) {
            next(error);
        }
    };

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

    public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('register');
        } catch (error) {
            next(error);
        }
    };

    public addnewuser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        
        try {

            if (User.name === req.body.newusername) {
                req.session.error = '이미 있는 계정입니다.';
                res.redirect('/');
            } else {
                this.authService.authRepository.users.push({name: req.body.newusername, password: req.body.newpassword});
                res.render('register', {message: '회원가입 성공.'});
                res.redirect('/');
            }
       
            // await this.authService.authenticate(req.body.username, req.body.password, (user) => {
            //     if (user === req.body.newusername) {
            //         req.session.error = '이미 있는 계정입니다.';
            //         res.redirect('/');
            //     } else {
            //         this.authService.authRepository.users.push({name: req.body.newusername, password: req.body.newpassword});
            //         res.render('register', {message: '회원가입 성공.'});
            //         res.redirect('/');
            //     }
            // });

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

        // this.app.get('/bbs', listBbs);
        // this.app.post('/write', writeBbs);
        // this.app.get('/sort', sortBbs)

        this.app.get('/bbs', this.authController.forumRepository.listBbs);
        this.app.post('/write', this.authController.forumRepository.writeBbs);
        this.app.get('/myBbs', this.authController.forumRepository.myBbs);

        this.app.get('/register', this.authController.register);
        this.app.post('/register', this.authController.addnewuser);
    }
}

const app = new App();

app.listen(8080)