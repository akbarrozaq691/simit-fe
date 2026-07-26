import type { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, HTMLAttributes } from 'react'

export function Table({ className = '', ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-ink-200">
      <table className={`w-full text-sm ${className}`} {...rest} />
    </div>
  )
}

export function THead({ className = '', ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`bg-ink-50 ${className}`} {...rest} />
}

export function TBody({ className = '', ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-ink-200 ${className}`} {...rest} />
}

export function TR({ className = '', ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...rest} />
}

export function TH({ className = '', ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-600 ${className}`}
      {...rest}
    />
  )
}

export function TD({ className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-2.5 text-ink-800 ${className}`} {...rest} />
}
