export default function CardGoal({
  price,
  column1,
  column2,
  value1,
  value2,
  light,
}: {
  price: string;
  column1: string;
  column2: string;
  value1: string;
  value2: string;
  light?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between p-3 rounded-xl  font-light
    ${
      (light && "bg-soft-blue text-primary-blue min-w-[170px] min-h-[170px] border border-primary-blue") ||
      "bg-gradient-to-tl from-primary-blue via-primary-blue to-primary-blue/50 text-white min-w-[172px] min-h-[172px]"
    }
    `}
    >
      <div>
        <span className="text-xl">s/</span>
        <p className="text-5xl font-normal">{price}</p>
      </div>
      <div className="flex justify-between pt-4 text-xs">
        <div>
          <p>{column1}</p>
          <p className="text-succes-primary">{value1}</p>
        </div>
        <div>
          <p>{column2}</p>
          <p className="text-danger-primary">{value2}</p>
        </div>
      </div>
    </div>
  );
}
