export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, productId } = body;

    if (!amount || !productId) {
      return Response.json(
        {
          success: false,
          message: "Amount and productId are required",
        },
        { status: 400 }
      );
    }

    // For now this is a mock payment init
    // Later we can replace this with real eSewa / Khalti integration
    return Response.json({
      success: true,
      message: "Payment initialized",
      paymentUrl: `/payment/success?orderId=${productId}`,
    });
  } catch (error) {
    console.log("ESEWA PAY ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to initialize payment",
      },
      { status: 500 }
    );
  }
}