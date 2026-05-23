'use client';

import { Card, Col, Row } from 'react-bootstrap';

export default function StatistiqueSkeleton() {
  return (
    <div className="stat-skeleton-wrapper">
      <Row className="g-4 mb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Col key={index} lg={2} md={4} sm={6}>
            <Card className="border-0 shadow-sm skeleton-card">
              <Card.Body>
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-value" />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <Row className="g-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Col key={index} lg={6}>
            <Card className="border-0 shadow-sm skeleton-card chart-skeleton">
              <Card.Body>
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-block" />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
