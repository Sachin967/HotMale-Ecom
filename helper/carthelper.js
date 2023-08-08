const Product = require('../model/product')
const Cart = require('../model/cartModel')
const { ObjectId } = require("mongodb");

const updateQuantity = async (data) => {
  const cartId = data.cartId;
  const proId = data.proId;
  const userId = data.userId;
  const count = data.count;
  const quantity = data.quantity;
  const product = await Product.findOne({ _id: proId });

  const quantitySingle = await Cart.aggregate([
    { $match: { user: userId.toString() } },
    { $unwind: "$products" },
    { $match: { 'products.product': new ObjectId(proId) } },
    { $project: { 'products.quantity': 1 } }
  ]);

  try { 
    if (count == -1 && quantity == 1) {
      await Cart.findOneAndUpdate(
        { _id: cartId, "products.product": proId },
        {
          $pull: { products: { product: proId } },
          $inc: { totalPrice: product.price * count }
        },
        { new: true }
      );

      return { status: true };
    } else {
      if (product.stock - quantity < 1 && count == 1) {
        return { status: 'outOfStock' };
      } else {
        await Cart.updateOne(
          { _id: cartId, "products.product": proId },
          {
            $inc: {
              "products.$.quantity": count,
              "products.$.total": product.price * count,
              totalPrice: product.price * count
            },
          }
        );

        const cart = await Cart.findOne(
          { _id: cartId, "products.product": proId },
          { "products.$": 1, totalPrice: 1 }
        );

        const newQuantity = cart.products[0].quantity;
        const newSubTotal = cart.products[0].price;
        const cartTotal = cart.totalPrice;

        return { status: true, newQuantity: newQuantity, newSubTotal: newSubTotal, cartTotal: cartTotal };
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteProduct = async (data) => {
  const cartId = data.cartId;
  const proId = data.proId;

  try {
    const product = await Product.findOne({ _id: proId });
    const cart = await Cart.findOne({ _id: cartId, "cartItems.productId": proId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const cartItem = cart.cartItems.find((item) => item.productId.equals(proId));
    if (!cartItem) {
      throw new Error("Product not found in the cart");
    }

    const quantityToRemove = cartItem.quantity;
    await Cart.updateOne(
      { _id: cartId, "cartItems.productId": proId },
      {
        $inc: { cartTotal: product.price * quantityToRemove * -1 },
        $pull: { cartItems: { productId: proId } },
      }
    );

    return { status: true };
  } catch (error) {
    throw error;
  }
};



module.exports ={
  
  updateQuantity,
  deleteProduct
}