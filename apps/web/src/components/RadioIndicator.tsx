export function RadioIndicator({
  checked,
  primary,
  border,
  foreground,
}: {
  checked: boolean;
  primary: string;
  border: string;
  foreground: string;
}) {
  return (
    <span
      className="flex h-4 w-4 items-center justify-center rounded-full border"
      style={{
        borderColor: checked ? primary : border,
        backgroundColor: checked ? primary : 'transparent',
      }}
    >
      {checked && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: foreground }}
        />
      )}
    </span>
  );
}
