import os

from openai import OpenAI


def analyse(text):

    client = OpenAI(
        api_key=os.getenv(
            "OPENAI_API_KEY"
        )
    )


    response = client.responses.create(
        model="gpt-5.6",
        input=text
    )


    return response.output_text

