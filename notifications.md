> For the complete documentation index, see [llms.txt](https://docs.dlocalgo.com/integration-api/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/payments/notifications.md).

# Notifications

Notifications are messages sent by dLocal Go server from events that are performed on its platform.

When a payment or refund status changes, dLocal Go will send a notification to the specified [notification\_url](/integration-api/welcome-to-dlocal-go-api/payments/create-a-payment.md#create-a-payment) in the created payment. The notification will be sent by using the HTTP POST method. The notification will also include the ID of the payment or refund in the body of the message.

```
curl -X POST \
  [notification_url] \
  -d '{
    "payment_id": "[Payment Id]"
}'
```

Once the merchant receives the notification, the merchant can [retrieve the payment](/integration-api/welcome-to-dlocal-go-api/payments/retrieve-a-payment.md#retrieve-a-payment) to get the **status** of the payment or refund.&#x20;

<figure><img src="https://1358172413-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FBY3HUq038UcwcSNNW0jr%2Fuploads%2F6epH1kN0bZvU7k14IV9D%2FGra%CC%81fico%20-%20API%20dLocalGo.png?alt=media&amp;token=57493c51-d77c-4328-91b5-a5ca63f73d52" alt=""><figcaption><p>Notifications diagram</p></figcaption></figure>

<figure><img src="https://1358172413-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FBY3HUq038UcwcSNNW0jr%2Fuploads%2FSEg982OQGRko5z9zVqdV%2FTEMPLATE-1.png?alt=media&amp;token=2ffb67b8-068e-418b-ac15-25f955f585ee" alt=""><figcaption><p>Refunds notification diagram</p></figcaption></figure>

If a notification returns an HTTP response other than 200, we will retry sending it. Failed notifications will be retried every 10 minutes for up to 30 days.

It is important to ensure that the `notification_url` is correctly specified in the initial request and that the server that will receive the notification is capable of handling HTTP POST requests.&#x20;

{% hint style="warning" %}
`notification_url` set incorrectly may result in delayed or missed notifications, which can impact merchants' ability to manage their payments and refunds effectively.
{% endhint %}

### Notification Validation

Notifications are signed using the `HMAC-SHA256` algorithm. Here’s an example of what the header looks like:

{% code overflow="wrap" %}

```json
"Authorization": "V2-HMAC-SHA256, Signature: b71712639e6d93e289e2ec0532a81ef27da72f875d81fdab2328ffffef90b833"
```

{% endcode %}

To verify the notification's validity, the merchant must calculate the signature independently and compare it with the one received.

#### **How to calculate the signature**

Assuming the following data:&#x20;

* **ApiKey**: MyMerchantApiKey
* **SecretKey**: MyMerchantSecretKey
* **Payload**: `{"payment_id":"DP-283"}`

{% code overflow="wrap" %}

```
Signature = HMAC('sha256', 'MyMerchantApiKey{"payment_id":"DP-283"}', 'MyMerchantSecretKey')
```

{% endcode %}

`HMAC` is a function that receives the arguments Algorithm, Message and SecretKey.

#### Sample implementation with Python

```python
import hmac
import hashlib

def generate_hmac(algorithm, message, secret_key):
    # Encode the secret key and the message to bytes
    secret_key_bytes = secret_key.encode('utf-8')
    message_bytes = message.encode('utf-8')
    
    # Create the HMAC object using the secret key and the specified algorithm
    hmac_obj = hmac.new(secret_key_bytes, message_bytes, algorithm)
    
    # Return the generated HMAC signature in hexadecimal format
    return hmac_obj.hexdigest()

# Example usage with provided data
api_key = "MyMerchantApiKey"
secret_key = "MyMerchantSecretKey"
payload = '{"payment_id":"DP-283"}'

# Concatenate the API key and payload as specified
message = api_key + payload

# Generate the HMAC signature using SHA-256
signature = generate_hmac(hashlib.sha256, message, secret_key)

print("Generated Signature:", signature)
```

Sample implementation with Java

```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

public class HMACGenerator {

    public static String generateHMAC(String algorithm, String message, String secretKey) 
            throws NoSuchAlgorithmException, InvalidKeyException {
        // Convert the secret key to a byte array
        SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), algorithm);

        // Create a Mac instance and initialize it with the secret key
        Mac mac = Mac.getInstance(algorithm);
        mac.init(secretKeySpec);

        // Compute the HMAC on the input message
        byte[] hmacBytes = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));

        // Convert the resulting byte array into a hexadecimal string
        StringBuilder result = new StringBuilder();
        for (byte b : hmacBytes) {
            result.append(String.format("%02x", b));
        }

        return result.toString();
    }

    public static void main(String[] args) {
        try {
            String apiKey = "MyMerchantApiKey";
            String secretKey = "MyMerchantSecretKey";
            String payload = "{\"payment_id\":\"DP-283\"}";

            // Concatenate the API key and payload as specified
            String message = apiKey + payload;

            // Generate the HMAC signature using SHA-256
            String signature = generateHMAC("HmacSHA256", message, secretKey);

            System.out.println("Generated Signature: " + signature);

        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            System.err.println("Error generating HMAC: " + e.getMessage());
        }
    }
}

```
