import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  innerClassName?: string;
};

const Button = ({ className, innerClassName, children, type, ...props }: ButtonProps) => {
  return (
    <button
      type={type ?? "button"}
      className={`animated-border inline-flex disabled:cursor-not-allowed disabled:opacity-40 ${className ?? ""}`}
      {...props}
    >
      <span
        className={`animated-border__inner inline-flex items-center justify-center rounded-xl bg-[var(--background)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand-purple)] ${innerClassName ?? ""}`}
      >
        {children}
      </span>
    </button>
  );
};

export default Button;
