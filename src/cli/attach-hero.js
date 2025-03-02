import * as fs from 'fs';
import * as path from 'path';
import { argv } from 'process';

const heroPath = path.resolve(__dirname, '../images/hero');
const blogPath = path.resolve(__dirname, '../content/blog');

if (!fs.existsSync(`${blogPath}/${argv[2]}.md`)) {
   console.log('❌ Blog not found');
   process.exit(1);
}

if (!fs.existsSync(`${heroPath}/image.png`)) {
   console.log('❌ Source image not found');
   process.exit(1);
}

fs.renameSync(`${heroPath}/image.png`, `${heroPath}/hero-${argv[2]}.png`);

const blogContent = fs.readFileSync(`${blogPath}/${argv[2]}.md`, 'utf-8');
const newContent = blogContent.replace(
   /heroImage:\s*'([^']*)'/g,
   `heroImage: '/src/images/hero/hero-${argv[2]}.png'`
);

fs.writeFileSync(`${blogPath}/${argv[2]}.md`, newContent);
console.log('✅ Hero image attached');
