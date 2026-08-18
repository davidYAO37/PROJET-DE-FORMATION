"use client";

import { Container, Card, Accordion, Badge } from "react-bootstrap";
import { GUIDE_SERVICES } from "@/lib/guideContent";
import ServiceGuidePoints from "@/components/guide/ServiceGuidePoints";

export default function GuidePage() {
  return (
    <Container className="py-4">
      <Card className="shadow-sm border-0 mb-4 bg-gradient bg-primary text-white">
        <Card.Body className="d-flex align-items-center gap-3">
          <i className="bi bi-book-half fs-1"></i>
          <div>
            <h2 className="mb-1 fw-bold">Guide d&apos;utilisation par service</h2>
            <p className="mb-0 opacity-75">
              Découvrez, point par point, comment utiliser chaque élément du menu de chaque service d&apos;Easy Medical.
            </p>
          </div>
        </Card.Body>
      </Card>

      <Accordion alwaysOpen>
        {GUIDE_SERVICES.map((service, index) => (
          <Accordion.Item eventKey={String(index)} key={service.code} className="mb-3 border rounded shadow-sm">
            <Accordion.Header>
              <i className={`bi ${service.icon} me-2 text-${service.color}`} style={{ fontSize: "20px" }}></i>
              <span className="fw-semibold">{service.label}</span>
              <Badge bg="light" text="dark" className="border ms-2">{service.points.length} points</Badge>
            </Accordion.Header>
            <Accordion.Body>
              <p className="text-muted">{service.intro}</p>
              <ServiceGuidePoints service={service} />
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </Container>
  );
}
