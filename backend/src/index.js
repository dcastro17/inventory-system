const app = require('./app');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '..', '.env') });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
