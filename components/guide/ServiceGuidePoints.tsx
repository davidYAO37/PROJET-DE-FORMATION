"use client";

import { Accordion, Badge } from "react-bootstrap";
import { GuideService } from "@/lib/guideContent";

interface ServiceGuidePointsProps {
  service: GuideService;
  idPrefix?: string;
}

export default function ServiceGuidePoints({ service, idPrefix }: ServiceGuidePointsProps) {
  const prefix = idPrefix ?? service.code;

  return (
    <Accordion alwaysOpen={false}>
      {service.points.map((point, pointIndex) => (
        <Accordion.Item eventKey={`${prefix}-${pointIndex}`} key={point.title} className="mb-2 border rounded">
          <Accordion.Header>
            <Badge bg={service.color} className="me-2">{pointIndex + 1}</Badge>
            <span className="fw-semibold">{point.title}</span>
          </Accordion.Header>
          <Accordion.Body>
            <p>{point.detail}</p>
            <div className="border rounded overflow-hidden">
              <img
                src={point.image}
                alt={`Capture d'écran : ${point.title} (${service.label})`}
                style={{ width: "100%", display: "block" }}
              />
            </div>
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
