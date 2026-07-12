from typing import List, Dict, Generator, Callable
import json
from loguru import logger
import cohere
from cohere import (
    UserChatMessageV2, 
    AssistantChatMessageV2,
    ToolV2,
    ToolCallV2,
    ChatMessages,
    SystemChatMessageV2,
    ToolChatMessageV2,
    TextToolContent
)

import os

from llm.llm_client import LLMClient

if __name__=="__main__":
    from dotenv import load_dotenv
    load_dotenv()

COHERE_API_KEY=os.getenv("COHERE_TRIAL_KEY", "")

class CohereClient(LLMClient):
    def __init__(self, model_name: str) -> None:
        self.model_name = model_name
        self.type = "cohere"
        self.co = cohere.ClientV2(COHERE_API_KEY)


    def stream_response(
        self,
        role: str,
        system_prompt: str,
        # message_history: List[Message],
        user_query: str,
        functions_map: Dict[str, Callable],
        tools: List[ToolV2],
    ) -> Generator[str]:
        messages: ChatMessages = [
            SystemChatMessageV2(content=system_prompt),
            UserChatMessageV2(content=user_query)
        ]
        while True:
            response = self.co.chat_stream(model=self.model_name, messages=messages, tools=tools)

            count = 0
            content = ""
            tool_plan = ""

            tool_calls: List[ToolCallV2] = []
            current_tool_call = ToolCallV2(id="0")

            for event in response:
                if event:
                    print(f"Event received: index: {count}, event type: {event.type}")

                    if event.type == "content-delta":
                        if event.delta and event.delta.message and event.delta.message.content and event.delta.message.content.text:
                            content += event.delta.message.content.text
                            print(f"Delta content: {event.delta.message.content.text}")
                            yield json.dumps({"model": self.model_name, "role": role, "message": event.delta.message.content.text}) + "\n"

                    if event.type == "tool-plan-delta":
                        if event.delta and event.delta.message and event.delta.message.tool_plan:
                            tool_plan += event.delta.message.tool_plan
                            print(f"Tool plan delta: {event.delta.message.tool_plan}")

                    if event.type == "tool-call-start":
                        if event.delta and event.delta.message and event.delta.message.tool_calls:
                            current_tool_call = event.delta.message.tool_calls
                            if current_tool_call.function and not current_tool_call.function.arguments:
                                current_tool_call.function.arguments = ""
                            print(f"Assigned to current_tool_calls: id: {current_tool_call.id}, name: {current_tool_call.function.name if current_tool_call.function is not None and current_tool_call.function.name is not None else "abcd"}")
                            print(f"Current arguments: {current_tool_call.function.arguments if current_tool_call.function is not None and current_tool_call.function.arguments is not None else "[]"}")

                    if event.type == "tool-call-delta":
                        if event.delta and event.delta.message and event.delta.message.tool_calls and event.delta.message.tool_calls.function and event.delta.message.tool_calls.function.arguments:
                            current_tool_call.function.arguments += event.delta.message.tool_calls.function.arguments # type: ignore
                            print(f"Added as delta: {event.delta.message.tool_calls.function.arguments}, full list: {current_tool_call.function.arguments}") # type: ignore

                    if event.type == "tool-call-end":
                        tool_calls.append(current_tool_call)

                    count += 1

            print(f"Final number of events: {count}\n")

            if content:
                messages.append(AssistantChatMessageV2(content=content))
                print(f"Final content received: {content}\n")

            if tool_plan or tool_calls:
                print(f"Final tool call plan: {tool_plan}\n")
                messages.append(AssistantChatMessageV2(
                    tool_calls=tool_calls
                ))

                for tc in tool_calls:
                    print("--- Tool call ---")
                    print(f"Function name: {tc.function.name if tc.function is not None else "tc.function is None"}")
                    print(f"Function arguments: {tc.function.arguments if tc.function is not None else "tc.function is None"}")

                    if tc.function is not None and tc.function.name is not None:
                        fn = functions_map.get(tc.function.name)
                        if fn is not None:
                            tool_result = fn(
                                **json.loads(tc.function.arguments if tc.function.arguments is not None else "")
                            )
                            print(f"Tool result: {tool_result}")

                            messages.append(
                                ToolChatMessageV2(
                                    tool_call_id=tc.id,
                                    content=[TextToolContent(text=str(tool_result))]
                                )
                            )
                        else :
                            print("fn is None")

            else:
                break