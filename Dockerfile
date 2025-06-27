# Imagen base oficial de Node.js
FROM node:18

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar los archivos de dependencias
COPY package*.json ./

# Copiar el archivo .env
COPY .env .env

# Instalar dependencias
RUN npm install

# Copiar el resto de la app
COPY . .

# Exponer el puerto (tu backend escucha en 3000)
EXPOSE 3000

# Comando para iniciar la app
CMD ["npm", "start"]
