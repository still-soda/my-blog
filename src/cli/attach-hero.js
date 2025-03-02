import * as fs from 'fs';
import * as path from 'path';
import { argv } from 'process';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const heroPath = path.resolve(__dirname, '../images/hero');
const blogPath = path.resolve(__dirname, '../content/blog');

if (!fs.existsSync(`${blogPath}/${argv[2]}.md`)) {
   console.log('❌ Blog not found');
   process.exit(1);
}

async function downloadRandomImage(toPath) {
   return await fetch('https://bing.img.run/rand.php').then((res) => {
      const reader = res.body.getReader();
      const writer = fs.createWriteStream(toPath);
      const { resolve, promise } = Promise.withResolvers();
      const pump = () =>
         reader.read().then(({ done, value }) => {
            if (done) {
               writer.end();
               resolve();
               return;
            }
            writer.write(Buffer.from(value));
            pump();
         });
      pump();
      return promise;
   });
}

console.log('🔄 Downloading random image...');
await downloadRandomImage(`image.png`);
console.log('✅ Random image downloaded');

fs.renameSync(`image.png`, `${heroPath}/hero-${argv[2]}.png`);

const blogContent = fs.readFileSync(`${blogPath}/${argv[2]}.md`, 'utf-8');
const newContent = blogContent.replace(
   /heroImage:\s*'([^']*)'/g,
   `heroImage: '/src/images/hero/hero-${argv[2]}.png'`
);

fs.writeFileSync(`${blogPath}/${argv[2]}.md`, newContent);
console.log('✅ Hero image attached');
