import fs from 'fs';
import path from 'path';
import enquirer from 'enquirer';

function getDate() {
   const date = new Date();
   const year = date.getFullYear();
   const month = date.getMonth() + 1;
   const day = date.getDate();

   const monthStr = {
      1: 'Jan',
      2: 'Feb',
      3: 'Mar',
      4: 'Apr',
      5: 'May',
      6: 'Jun',
      7: 'Jul',
      8: 'Aug',
      9: 'Sep',
      10: 'Oct',
      11: 'Nov',
      12: 'Dec',
   }[month];

   return `${monthStr} ${day} ${year}`;
}

const questions = [
   {
      type: 'input',
      name: 'title',
      message: '📄文章标题：',
   },
   {
      type: 'input',
      name: 'date',
      message: '📅发布日期：',
      initial: getDate(),
   },
   {
      type: 'input',
      name: 'filename',
      message: '💾文件名：',
      initial: 'blog-file-name',
   },
   {
      type: 'input',
      name: 'description',
      message: '📝文章描述：',
      initial: '无描述',
   },
];

await enquirer.prompt(questions).then((answers) => {
   const { title, date, filename, description } = answers;
   const blogPath = path.resolve(__dirname, '../content/blog');
   const content =
      '---\n' +
      `title: "${title}"\n` +
      `pubDate: "${date}"\n` +
      `description: "${description}"\n` +
      'heroImage: "/images/hero-image.jpg"\n' +
      '---\n';
   fs.writeFileSync(`${blogPath}/${filename}.md`, content, { flag: 'w' });
   console.log(`🎉文件已生成！ path: /src/content/blog/${filename}.md`);
});
