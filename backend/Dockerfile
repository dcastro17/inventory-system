FROM node:18

WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --omit=dev

# Copiar el resto del código fuente
COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]