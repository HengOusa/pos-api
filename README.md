# pos-api

- upload one image
- upload multiple image
- remove image | update image
- image path
- generate_new_barcode
- check_is_existing barcode
- insert multiple records to tables

- form data (clien)
- file / image (client/nodeJs)
- multer libary (nodeJs)
  - store name is DB (image(varchar(250)))
  - file store in server (apache)

  ===============================

- npm install express multer

=========================================

# Configuration

## Environment Variables (.env)

```
APP_NAME=POS
APP_VERSION=1.0
IMAGE_PATH=D:/Laragon/www/Node api/pos-api/public
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pos_db
DB_PORT=3306
SECRET_KEY=aksdjfaskdjfalksd$lsdsdfraeqaesdfasdfasdfaeasdfaserfawefffjalksdfjasdlksjdf;aisufisdvjksoaifpqaoidsfoertakspdijfpaodijasdfasdfsadfcoasjiodgfu8qw
```

## Application Port

The API server runs by default on port `3000` (see `server.js`).

## Static Files

Product images are served from:

```
<IMAGE_PATH>/products
```

Where `IMAGE_PATH` is set in the `.env` file.

## Database Connection

Database connection uses the following environment variables (see `src/util/connection.js`):

- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- DB_PORT

## JWT Secret

The secret key for JWT is set in `SECRET_KEY` in `.env` and used in authentication (see `src/controllers/auth.controller.js`).

## Scripts (package.json)

```
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon server.js"
}
```

## Main Dependencies

- express
- multer
- dotenv
- cors
- mysql2
- jsonwebtoken
- bcryptjs

## Configuration Endpoint

`/api/config` returns categories, roles, suppliers, brands, users, customers, and products (see `src/controllers/config.controller.js`).
