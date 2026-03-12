const getAccessToken = (paramData) => {
  const keyToken = "alsjdoifjao;isdfsdfasdfasf";
  const data = {
    id: 1,
    name: "heng",
  };
  const access_token = jwt.sign({ data: data }, keyToken, { expiresIn: "1h" });
  return access_token;
};

exports.validate_token = () => {
  // cal in middleware in route (role route, user route, reacher route)
  return (req, res, next) => {
    var authorization = req.headers.authorization; // tokenn from client
    var token_from_client = null;
    if (authorization != null && authorization != "") {
      token_from_client = authorization.split(" "); // authorization : "Bearer lskdjfskdflskdf"
      token_from_client = token_from_client[1]; // get only acceess_token
    }
    if (token_from_client == null) {
      res.status(401).json({
        message: "Unauthorized",
      });
    } else {
      const KeyToken = ";asdjfpiowejfaskjdf@oasiudf";
      jwt.verify(token_from_client, keyToken, (error, result) => {
        if (error) {
          res.status(401).send({
            message: "Unauthorized",
            error: error,
          });
        } else {
          req.currect_id = result.data.profile.id; // write user property
          // req.user_id = result.data.Id; // write user property
          // req.user_name = req.data.Username; // write user property
          next(); // continue controller
        }
      });
    }
  };
};