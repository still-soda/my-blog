type HeadingTree = Array<HeadingTree> | { text: string; slug: string };

interface Props {
   headings: HeadingTree;
}

export default function ToC({ headings }: Props) {
   return (
      <>
         {Array.isArray(headings) ? (
            <ol>
               {headings.map((heading, idx) => (
                  <ToC headings={heading} key={idx} />
               ))}
            </ol>
         ) : (
            <li>
               <a href={`#${headings.slug}`}>{headings.text}</a>
            </li>
         )}
      </>
   );
}
