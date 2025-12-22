# ============================================================================
# AI Service - Consumer & Producer (Python)
# ============================================================================

import os
import logging
from dotenv import load_dotenv
from rabbitmq_client import RabbitMQClient, EventType

# Load environment
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class AIService:
    """AI Service that consumes requests and produces responses"""

    def __init__(self):
        self.rabbitmq = RabbitMQClient(
            url=os.getenv("RABBIT_URL", "amqp://guest:guest@localhost:5672/"),
        )

    def handle_ai_request(self, event: dict) -> None:
        """Handle incoming AI requests"""
        try:
            payload = event["payload"]
            correlation_id = event.get("correlationId")

            logger.info(f"Processing AI request for user: {payload['userId']}")
            logger.info(f"Prompt: {payload['prompt']}")

            # ========================================
            # YOUR AI LOGIC HERE
            # ========================================
            # Example: Call OpenAI, Anthropic
            result = self.generate_ai_response(payload["prompt"])

            # Publish response
            self.rabbitmq.publish(
                event_type=EventType.AI_RESPONSE,
                payload={
                    "userId": payload["userId"],
                    "result": result,
                    "metadata": {
                        "model": "gpt-4",
                        "promptLength": len(payload["prompt"]),
                    },
                },
                correlation_id=correlation_id,
            )

            logger.info(f"✅ AI response sent for correlation: {correlation_id}")

        except Exception as e:
            logger.error(f"Error handling AI request: {e}")
            raise

    def generate_ai_response(self, prompt: str) -> str:
        """
        Your AI generation logic
        Replace with actual AI API calls
        """
        # Example placeholder
        import time

        time.sleep(2)  # Simulate AI processing

        return f"AI generated response for: {prompt[:50]}..."

    def start(self):
        """Start the AI service"""
        try:
            # Connect to RabbitMQ
            self.rabbitmq.connect()

            # Subscribe to AI requests
            self.rabbitmq.subscribe(
                event_type=EventType.AI_REQUEST,
                handler=self.handle_ai_request,
                queue_name="ai.requests.queue",
            )

            logger.info("🤖 AI Service started and listening for requests...")

            # Start consuming (blocking)
            self.rabbitmq.start_consuming()

        except KeyboardInterrupt:
            logger.info("Shutting down AI service...")
        finally:
            self.rabbitmq.close()


if __name__ == "__main__":
    service = AIService()
    service.start()
