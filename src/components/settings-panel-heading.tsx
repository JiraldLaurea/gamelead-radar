type SettingsPanelHeadingProps = {
  actions?: React.ReactNode;
  subtitle: string;
  title: string;
};

export function SettingsPanelHeading({ actions, subtitle, title }: SettingsPanelHeadingProps) {
  return (
    <div className="settings-panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="settings-panel-heading-actions">{actions}</div> : null}
    </div>
  );
}
