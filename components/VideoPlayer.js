export default function VideoPlayer({ src, className }) {
  return (
    <video controls preload="metadata" className={className}>
      <source src={src + "#t=0.1"} />
    </video>
  );
}