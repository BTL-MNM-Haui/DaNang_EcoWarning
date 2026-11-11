import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const file=new URL('../backend/.env',import.meta.url);
if(existsSync(file)){console.log('Giữ backend/.env hiện có.');}
else{
 const template=readFileSync(new URL('../backend/.env.example',import.meta.url),'utf8')
  .replace('replace-with-local-password',randomBytes(24).toString('hex'))
  .replace('replace-with-local-redis-password',randomBytes(24).toString('hex'))
  .replace('replace-with-base64-encoded-32-byte-secret',randomBytes(32).toString('base64'));
 writeFileSync(file,template,{mode:0o600});console.log('Đã tạo backend/.env với mật khẩu local và khóa JWT ngẫu nhiên.');
}
console.log('Cấu hình khóa bản đồ, OpenWeather, SMTP và Cloudinary trong backend/.env khi cần các dịch vụ bên ngoài.');
