import { Card, CardContent } from "~/components/ui/card";
import { DollarSign } from "lucide-react";
import type { BalanceMensual } from "~/services/finanzasService";

type Props = {
  balance: BalanceMensual;
  formatMoney: (n: number) => string;
  /** "compact" para home, "default" para finanzas */
  variant?: "compact" | "default";
};

/**
 * Tres saldos en grande: actual (neto − capital Renashop), Renashop (capital), total (neto del mes).
 */
export function SaldoDesgloseCard({ balance, formatMoney, variant = "default" }: Props) {
  const capitalRenashop = balance.entradasMesRenashopCapital;
  const saldoActual = balance.saldo - capitalRenashop;
  const saldoTotal = balance.saldo;

  const netPositive = balance.saldo >= 0;
  const isCompact = variant === "compact";

  const labelClass = isCompact ? "text-xs font-medium text-gray-600" : "text-sm font-medium text-gray-600";
  const amountClass = isCompact ? "text-xl font-bold mt-1" : "text-2xl font-bold";
  const divider = netPositive ? "border-primary-blue/15" : "border-orange-200";

  const colorActual = saldoActual >= 0 ? "text-primary-blue" : "text-orange-700";
  const colorRenashop = "text-amber-800";
  const colorTotal = saldoTotal >= 0 ? "text-primary-blue" : "text-orange-700";

  const block = (title: string, amount: number, color: string) => (
    <div>
      <p className={labelClass}>{title}</p>
      <p className={`${amountClass} ${color}`}>S/ {formatMoney(amount)}</p>
    </div>
  );

  return (
    <Card
      className={
        netPositive ? "bg-primary-blue/5 border-primary-blue/20" : "bg-orange-50 border-orange-200"
      }
    >
      <CardContent className={isCompact ? "pt-5 pb-4" : "pt-6"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-4">
            {block("Saldo actual", saldoActual, colorActual)}
            <div className={`border-t ${divider} pt-4`}>
              {block("Capital Renashop", capitalRenashop, colorRenashop)}
            </div>
            <div className={`border-t ${divider} pt-4`}>
              {block("Saldo total", saldoTotal, colorTotal)}
            </div>
          </div>
          <DollarSign
            className={`shrink-0 ${isCompact ? "w-7 h-7" : "w-8 h-8"} ${netPositive ? "text-primary-blue" : "text-orange-500"}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
