// Devuelve solo el nombre de carpeta con fecha y hora actual (timestamp)
const now = new Date();
const pad = n => n.toString().padStart(2, '0');
const dir = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
console.log(dir);
