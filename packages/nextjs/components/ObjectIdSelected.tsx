import React from "react";
import Image from "next/image";

type CheckboxGridProps = {
  children: React.ReactNode;
  checkedItems: CheckboxItem[];
  onChange: (index: number) => void;
};

interface CheckboxItem {
  id: number;
  checked: boolean;
  img: string;
  alt: string;
}

export const ObjectIdSelected: React.FC<CheckboxGridProps> = ({ onChange, checkedItems }) => {
  return (
    <div>
      <p className="text-xs text-gray-300">IN SEARCH</p>
      <p className="font-regular text-md">Searching</p>
      <div className={"flex flex-col justify-center "}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" }}>
          {checkedItems
            .filter((item: CheckboxItem) => item.checked)
            .map((item: CheckboxItem, rowIndex) => (
              <label key={`${rowIndex}`} style={{ display: "block" }}>
                <input type="checkbox" checked={item.checked} onChange={() => onChange(item.id)} />
                <div> {item.alt} </div>
                <Image src={item.img} alt={item.alt} height={150} width={150} />
              </label>
            ))}
        </div>
      </div>
      <p className="text-xs text-gray-300">OPTIONS</p>
      <p className="font-regular text-md">Other options</p>
      <div className={"flex flex-col items-end justify-center"}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {checkedItems
            .filter((item: CheckboxItem) => !item.checked)
            .map((item: CheckboxItem, rowIndex) => (
              <label key={`${rowIndex}`} style={{ display: "block" }}>
                <input type="checkbox" checked={item.checked} onChange={() => onChange(item.id)} />
                <div> {item.alt} </div>
                <Image src={item.img} alt={item.alt} height={150} width={150} />
              </label>
            ))}
        </div>
      </div>
    </div>
  );
};
