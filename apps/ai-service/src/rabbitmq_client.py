# ============================================================================
# Python RabbitMQ Client - Producer & Consumer
# ============================================================================

import json
import logging
import uuid
from datetime import datetime
from typing import Callable, Dict, Any, Optional
from enum import Enum

import pika
from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import BasicProperties

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Event types matching TypeScript definitions"""

    AI_REQUEST = "ai.request"
    AI_RESPONSE = "ai.response"
    VIDEO_UPLOAD = "video.upload"
    VIDEO_PROCESS = "video.process"
    VIDEO_COMPLETE = "video.complete"
    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"


class RabbitMQClient:
    """Generic RabbitMQ client for Python services"""

    def __init__(
        self,
        url: str,
        exchange: str = "morpho.events",
        dead_letter_exchange: str = "morpho.dlx",
    ):
        self.url = url
        self.exchange = exchange
        self.dead_letter_exchange = dead_letter_exchange
        self.connection = None
        self.channel: Optional[BlockingChannel] = None
        self.is_connected = False

    def connect(self) -> None:
        """Connect to RabbitMQ"""
        try:
            logger.info("🐰 Connecting to RabbitMQ...")

            # Parse connection URL
            parameters = pika.URLParameters(self.url)
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()

            # Setup exchanges
            self.channel.exchange_declare(
                exchange=self.exchange, exchange_type="topic", durable=True
            )

            self.channel.exchange_declare(
                exchange=self.dead_letter_exchange, exchange_type="topic", durable=True
            )

            self.is_connected = True
            logger.info("✅ Connected to RabbitMQ")

        except Exception as e:
            logger.error(f"❌ Failed to connect to RabbitMQ: {e}")
            raise

    def publish(
        self,
        event_type: EventType,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> str:
        """Publish an event to the exchange"""
        if not self.channel:
            raise RuntimeError(
                "RabbitMQ channel not initialized. Call connect() first."
            )

        event_id = str(uuid.uuid4())

        event = {
            "id": event_id,
            "type": event_type.value,
            "timestamp": datetime.utcnow().isoformat(),
            "correlationId": correlation_id,
            "payload": payload,
        }

        message = json.dumps(event)

        properties = BasicProperties(
            content_type="application/json",
            delivery_mode=2,  # Persistent
            timestamp=int(datetime.utcnow().timestamp()),
            message_id=event_id,
            correlation_id=correlation_id,
            reply_to=reply_to,
        )

        self.channel.basic_publish(
            exchange=self.exchange,
            routing_key=event_type.value,
            body=message,
            properties=properties,
        )

        logger.info(f"📤 Published event: {event_type.value} [{event_id}]")
        return event_id

    def subscribe(
        self,
        event_type: EventType,
        handler: Callable[[Dict[str, Any]], None],
        queue_name: Optional[str] = None,
    ) -> None:
        """Subscribe to events by type"""
        if not self.channel:
            raise RuntimeError("RabbitMQ channel not initialized")

        queue = queue_name or f"{event_type.value}.queue"

        # Assert queue with DLX
        self.channel.queue_declare(
            queue=queue,
            durable=True,
            arguments={"x-dead-letter-exchange": self.dead_letter_exchange},
        )

        # Bind queue to exchange
        self.channel.queue_bind(
            queue=queue, exchange=self.exchange, routing_key=event_type.value
        )

        # Set prefetch
        self.channel.basic_qos(prefetch_count=1)

        logger.info(f"📥 Subscribed to {event_type.value} on queue: {queue}")

        def callback(ch, method, properties, body):
            try:
                event = json.loads(body)
                logger.info(f"📨 Received event: {event['type']} [{event['id']}]")

                # Call handler
                handler(event)

                # Acknowledge
                ch.basic_ack(delivery_tag=method.delivery_tag)
                logger.info(f"✅ Processed event: {event['type']} [{event['id']}]")

            except Exception as e:
                logger.error(f"❌ Error processing message: {e}")
                # Reject and send to DLX (don't requeue)
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

        self.channel.basic_consume(queue=queue, on_message_callback=callback)

    def start_consuming(self) -> None:
        """Start consuming messages (blocking)"""
        if not self.channel:
            raise RuntimeError("RabbitMQ channel not initialized")

        logger.info("🎧 Starting to consume messages...")
        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            logger.info("⏸️  Stopping consumer...")
            self.channel.stop_consuming()

    def close(self) -> None:
        """Close connection"""
        try:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
                self.is_connected = False
                logger.info("👋 RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"Error closing RabbitMQ connection: {e}")
