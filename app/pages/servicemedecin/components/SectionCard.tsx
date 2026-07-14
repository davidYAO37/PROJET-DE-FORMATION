"use client";

import { Card, Button } from "react-bootstrap";

interface SectionCardProps {
  title: string;
  icon: string;
  color?: "success" | "warning" | "info" | "primary" | "danger" | "secondary";
  isActive?: boolean;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}

const colorMap = {
  success: { bg: "bg-success", text: "text-white", iconBg: "bg-white", iconText: "text-success" },
  warning: { bg: "bg-warning", text: "text-dark", iconBg: "bg-dark", iconText: "text-warning" },
  info: { bg: "bg-info", text: "text-white", iconBg: "bg-white", iconText: "text-info" },
  primary: { bg: "bg-primary", text: "text-white", iconBg: "bg-white", iconText: "text-primary" },
  danger: { bg: "bg-danger", text: "text-white", iconBg: "bg-white", iconText: "text-danger" },
  secondary: { bg: "bg-secondary", text: "text-white", iconBg: "bg-white", iconText: "text-secondary" },
};

export default function SectionCard({
  title,
  icon,
  color = "primary",
  isActive = false,
  subtitle,
  actionLabel,
  actionIcon = "bi-check-circle",
  onAction,
  children,
  className = "",
}: SectionCardProps) {
  const active = colorMap[color];
  const inactive = { bg: "bg-light", text: "text-dark", iconBg: `bg-${color}`, iconText: "text-white" };
  const theme = isActive ? active : inactive;

  return (
    <Card className={`shadow-sm border-0 mb-4 ${className}`}>
      <Card.Header className={`${theme.bg} ${theme.text} d-flex justify-content-between align-items-center py-3`}>
        <div className="d-flex align-items-center">
          <div className={`rounded-circle ${theme.iconBg} ${theme.iconText} p-2 me-3 d-flex align-items-center justify-content-center`} style={{ width: 40, height: 40 }}>
            <i className={`bi ${icon} fs-5`}></i>
          </div>
          <div>
            <h5 className="mb-0 fw-semibold">{title}</h5>
            {subtitle && <small className="opacity-75">{subtitle}</small>}
          </div>
        </div>
        {actionLabel && onAction && (
          <Button
            variant={isActive ? "light" : color}
            size="sm"
            onClick={onAction}
            className="rounded-pill"
          >
            <i className={`bi ${actionIcon} me-1`}></i>
            {actionLabel}
          </Button>
        )}
      </Card.Header>
      <Card.Body className="p-3">
        {children}
      </Card.Body>
    </Card>
  );
}
