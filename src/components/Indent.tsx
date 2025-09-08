/**
 * @author: luxudongg@gmail.com
 * 控制缩进
 */

export default function Indent(props: { size?: number }) {
  const count = (props.size || 2) * 4;
  return Array.from({ length: count }).map((_, i) => (
    <span key={i}>&nbsp;</span>
  ));
}
