const jwt = require('jsonwebtoken');

let checkAuth = (req, res, next) => {
    let token = req.get('token');
    jwt.verify(token, "secret-ajea14019", (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                err: {
                    message: "Token no valido"
                }
            });
        }
        req.user = decoded.user;
        next();
    })
}
module.exports = {checkAuth};
