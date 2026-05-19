import Link from "next/link";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400"
});

type BrandLogoProps = {
  href?: string;
  className?: string;
};

export function BrandLogo({ href = "/app", className = "" }: BrandLogoProps) {
  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label="CyBully home">
      <span className={`${pacifico.className} text-3xl leading-none text-ink`}>CyBully</span>
    </Link>
  );
}
