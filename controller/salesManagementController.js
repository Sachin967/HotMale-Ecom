const Order = require('../model/ordersM');
const moment = require('moment')
const Product = require('../model/product')
const User =require('../model/model')

const salesController ={

  // dailyReport: async (req, res) => {
  //   try {
  //     const start = moment(req.query.startDate, 'YYYY-MM-DD').startOf('day');
  //     const end = moment(req.query.endDate, 'YYYY-MM-DD').endOf('day');
      
  //   console.log(start);
  //   console.log(end);
  
  //     const orderTotal = await Order.find({
  //       createdAt: { $gte: start, $lte: end }
  //     }).countDocuments();
  
  //     const orderSuccess = await Order.find({
  //       createdAt: { $gte: start, $lte: end },
  //       'products.status': 'Delivered' 
  //     }).countDocuments();
      
  
  //     const orderFail = orderTotal - orderSuccess;
  
  //     let codCount = 0;
  //     let razorpayCount = 0;
  //     let totalRevenue = 0;
  //     let totalProductCount = 0;
  
  //     const orderSuccessDetails = await Order.find({
  //       createdAt: { $gte: start, $lte: end },
  //       'products.status': 'Delivered' 
  //     });
  
  //     orderSuccessDetails.forEach(order => {
  //       totalRevenue += order.total;
  //       totalProductCount += order.products.length;
  //       if (order.paymentMethod === 'cod') {
  //         codCount++;
  //       } else if (order.paymentMethod === 'razorpay') {
  //         razorpayCount++;
  //       }
  //     });
  
  //     const averageRevenue = totalRevenue / totalProductCount;
  //       return res.json({
  //       orderTotal,
  //       orderSuccess,
  //       orderFail,
  //       codCount,
  //       razorpayCount,
  //       totalRevenue,
  //       averageRevenue,
  //       totalProductCount,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ message: 'An error occurred while generating the daily report.' });
  //   }
  // },
  SalesReport : async (req, res) => {
    try {
      const report = await Order.find({
        'products.status': 'Delivered' // Filter orders where any product has 'Delivered' status
      })
      .populate('products.product', 'name') // Populate the 'product' field from the 'Product' model and select only the 'name' field
      .exec();
  
      let details = [];
  
      const getDate = (date) => {
        const orderDate = new Date(date);
        const day = orderDate.getDate();
        const month = orderDate.getMonth() + 1;
        const year = orderDate.getFullYear();
        return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${isNaN(year) ? "0000" : year}`;
      };
  
      for (const order of report) {
        const product = await Product.findById(order.products[0].product);
      
        const user = await User.findById(order.user);
        const userName = user ? user.name : 'unknown';
        const productName = product ? product.pname : 'Unknown Product';
      
        const orderDate = getDate(order.createdAt);
      
        details.push({
          order,
          productName,
          orderDate,
          userName
        });
      }
  
      res.render('salesReport', { details, getDate });
    } catch (error) {
      console.log(error.message);
    }
  },
  
  

postReport : async (date) => {
    try {
      const start = new Date(date.startdate);
      const end = new Date(date.enddate);
  
      const response = await Order.aggregate([
        {
          $match: {
            $and: [
              { "products.status": "Delivered" },
              {
                "createdAt": {
                  $gte: start,
                  $lte: new Date(end.getTime() + 86400000),
                },
              },
            ],
          },
        },
      ]).exec();
      
  
      // Fetch product details for each order item
      const orderData = await Promise.all(response.map(async (order) => {
        const user = await User.findById(order.user).exec()
       
        const userName = user ? user.name : 'unknown';
        console.log(userName);
        const itemsWithProductDetails = await Promise.all(order.products.map(async (item) => {
          const product = await Product.findById(item.product).exec()
         
          const productName = product ? product.pname : 'Unknown Product';
          console.log(productName);
          return { ...item, productName };
        }));
  
        return { ...order, userName: userName, products: itemsWithProductDetails };
      }));
  
      return orderData;
    } catch (error) {
    
      console.log(error.message);
    }
  },

  postSalesReport :async (req, res) => {
    try {
      const details = [];
      const getDate = (date) => {
        const orderDate = new Date(date);
        const day = orderDate.getDate();
        const month = orderDate.getMonth() + 1;
        const year = orderDate.getFullYear();
        return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${isNaN(year) ? "0000" : year}`;
      };
  
      const orderData = await salesController.postReport(req.body); // Notice how we call postReport using salesControl
     
  
      orderData.forEach((order) => {
        const productName = order.products[0].productName || 'Unknown Product';
        const userName = order.userName || 'Unknown User';

        const orderDetail = {
          order: order,
          orderDate: getDate(order.createdAt),
          productName: productName,
          userName: userName, // Include userName here
      };
        details.push(orderDetail);
      });
  
      res.render("salesReport", { details, getDate });
    } catch (error) {
      console.log('looo');
      console.log(error.message);
    }
  },
  
  

  // yearlyReport : async(req,res)=>{
  //   try {
  //     const start = moment(req.query.startDate);
  //   const end = moment(req.query.endDate);

  //     const orderTotal = await Order.find({
  //       createdAt: { $gte: start, $lte: end }
  //     }).countDocuments();
  
  //     const orderSuccessdetails = await Order.find({
  //       createdAt: { $gte: start, $lte: end },
  //       'products.status': 'Delivered' 
  //     });
  
  //     const orderSuccess = await Order.find({
  //       createdAt: { $gte: start, $lte: end },
  //       'products.status': 'Delivered' 
  //     }).countDocuments();
      
  //     let codCount = 0;
  //     let razorpayCount = 0;
  //     let totalRevenue = 0;
  //     let totalProductCount = 0;
  
  //     orderSuccessdetails.forEach(order => {
  //       totalRevenue += order.total;
  //       totalProductCount += order.products.length;
       
  //         if (order.paymentMethod === 'cod') {
  //           codCount++;
  //         } else if (order.paymentMethod === 'razorpay') {
  //           razorpayCount++;
  //         }
        
  //     });
  
  //     const averageRevenue = totalRevenue / totalProductCount;
    
  //     return res.json({
  //       orderTotal,
  //       orderSuccess,
  //       orderFail: orderTotal - orderSuccess,
  //       codCount,
  //       razorpayCount,
  //       totalRevenue,
  //       averageRevenue,
  //       totalProductCount,
  //       orderSuccessdetails
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ message: 'An error occurred while generating the yearly report.' });
  //   }
  // },

  // monthlyReport : async(req,res)=>{
  //   try {
  //     const start = moment().subtract(30, 'days').startOf('day'); // Data for the last 30 days
  //     const end = moment().endOf('day');
  
  //     const orderSuccessDetails = await Order.find({
  //       createdAt: { $gte: start, $lte: end },
  //       'products.status': 'Delivered' 
  //     });
  
  //     const monthlySales = {};
  
  //     orderSuccessDetails.forEach(order => {
  //       const monthName = moment(order.createdAt).format('MMMM');
  //       if (!monthlySales[monthName]) {
  //         monthlySales[monthName] = {
  //           revenue: 0,
  //           productCount: 0,
  //           orderCount: 0,
  //           codCount: 0,
  //           razorpayCount: 0,
  //         };
  //       }
  //       monthlySales[monthName].revenue += order.total;
  //       monthlySales[monthName].productCount += order.products.length;
  //       monthlySales[monthName].orderCount++;
  
  //       if (order.paymentMethod === 'cod') {
  //         monthlySales[monthName].codCount++;
  //       } else if (order.paymentMethod === 'razorpay') {
  //         monthlySales[monthName].razorpayCount++;
  //       }
  //     });
  
  //     const monthlyData = {
  //       labels: [],
  //       revenueData: [],
  //       productCountData: [],
  //       orderCountData: [],
  //       codCountData: [],
  //       razorpayCountData: [],
  //     };
  
  //     for (const monthName in monthlySales) {
  //       if (monthlySales.hasOwnProperty(monthName)) {
  //         monthlyData.labels.push(monthName);
  //         monthlyData.revenueData.push(monthlySales[monthName].revenue);
  //         monthlyData.productCountData.push(monthlySales[monthName].productCount);
  //         monthlyData.orderCountData.push(monthlySales[monthName].orderCount);
  //         monthlyData.codCountData.push(monthlySales[monthName].codCount);
  //         monthlyData.razorpayCountData.push(monthlySales[monthName].razorpayCount);
  //       }
  //     }
  
  //     return res.json(monthlyData);
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ message: 'An error occurred while generating the monthly report.' });
  //   }
  // },
  // weeklySalesReport: async (req, res) => {
  //   try {
  //     const start = moment().startOf('week'); // Start of current week (Sunday)
  //     const end = moment().endOf('week'); // End of current week (Saturday)
  // console.log(start);
  // console.log(end);
  //     const orderSuccessDetails = await Order.find({
  //       createdAt: { $gte: start, $lte: end },
  //       'products.status': 'Delivered' 
  //     });
      
  //     const orderTotal = await Order.find({
  //       createdAt: { $gte: start, $lte: end }
  //     }).countDocuments();
      
  //     const orderSuccess = await Order.find({
  //       createdAt: { $gte: start, $lte: end },
  //       'products.status': 'Delivered' 
  //     }).countDocuments();
  //     console.log(orderSuccess);
      
  //     let totalRevenue = 0;
  //     let averageRevenue = 0;
  //     let paymentMethodBreakdown = {};
  //     let totalProductCount = 0;
  //     let codCount= 0;
  //      let razorpayCount= 0;
  
  //     orderSuccessDetails.forEach(order => {
        
  //         if (order.paymentMethod === 'cod') {
  //           codCount++;
  //         } else if (order.paymentMethod === 'razorpay') {
  //           razorpayCount++;
  //         }
        
        
  //       totalRevenue += order.total;
  //       totalProductCount += order.products.length;
  
  //       const paymentMethod = order.paymentMethod;
  //       paymentMethodBreakdown[paymentMethod] = (paymentMethodBreakdown[paymentMethod] || 0) + 1;
  //     });
  
  //     if (orderSuccess > 0) {
  //       averageRevenue = totalRevenue / orderSuccess;
  //     }
  
  //     const salesReport = {
  //       orderTotal,
  //       orderSuccess,
  //       totalRevenue,
  //       averageRevenue,
  //       paymentMethodBreakdown,
  //       totalProductCount,
  //       orders:orderSuccessDetails,
  //       codCount,
  //       razorpayCount
  //     };
  //     console.log(salesReport);
  
  //     return res.json(salesReport);
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ message: 'An error occurred while generating the sales report.' });
  //   }
  // }
  weeklySalesReport: async (req, res) => {
    try {
      const start = moment().startOf('week'); // Start of current week (Sunday)
      const end = moment().endOf('week'); // End of current week (Saturday)
  
      const orderSuccessDetails = await Order.find({
        createdAt: { $gte: start, $lte: end },
        'products.status': 'Delivered'
      });
  
      const weeklySales = {};
  
      let totalRevenue = 0; // Initialize total revenue
      let totalDeliveredOrders = 0; // Initialize total delivered order count
      let totalSoldProducts = 0; // Initialize total sold product count
      const orders = await Order.find({'products.status': 'Delivered'})
      
      orders.forEach((order)=>{
        totalRevenue+=order.total
        totalDeliveredOrders++
        totalSoldProducts += order.products.length;
      })
  
      orderSuccessDetails.forEach(order => {
        const dayName = moment(order.createdAt).format('dddd'); // Get the day of the week
  
        if (!weeklySales[dayName]) {
          weeklySales[dayName] = {
            revenue: 0,
            productCount: 0,
            orderCount: 0,
            codCount: 0,
            razorpayCount: 0,
            walletCount: 0
          };
        }
  
        weeklySales[dayName].revenue += order.total;
        weeklySales[dayName].productCount += order.products.length;
        weeklySales[dayName].orderCount++;
       
  
        if (order.paymentMethod === 'cod') {
          weeklySales[dayName].codCount++;
        } else if (order.paymentMethod === 'razorpay') {
          weeklySales[dayName].razorpayCount++;
        } else if (order.paymentMethod === 'wallet') {
          weeklySales[dayName].walletCount++;
        }
      });
  
      const weeklyData = {
        labels: [],
        revenueData: [],
        productCountData: [],
        orderCountData: [],
        codCountData: [],
        razorpayCountData: [],
        walletCountData: [],
        totalRevenue, // Add total revenue to the response
        totalDeliveredOrders, // Add total delivered order count to the response
        totalSoldProducts // Add total sold product count to the response
      };
     
  
      for (const dayName in weeklySales) {
        if (weeklySales.hasOwnProperty(dayName)) {
          weeklyData.labels.push(dayName);
          weeklyData.revenueData.push(weeklySales[dayName].revenue);
          weeklyData.productCountData.push(weeklySales[dayName].productCount);
          weeklyData.orderCountData.push(weeklySales[dayName].orderCount);
          weeklyData.codCountData.push(weeklySales[dayName].codCount);
          weeklyData.razorpayCountData.push(weeklySales[dayName].razorpayCount);
          weeklyData.walletCountData.push(weeklySales[dayName].walletCount);
        }
      }
  
      return res.json(weeklyData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'An error occurred while generating the weekly report.' });
    }
  },
  

paymentMethodCount : async(req,res) => {
  try {
    const order = await Order.find({
      'products.status' : 'Delivered'
    })
    // console.log(order);

    let codCount=0
    let razorpayCount = 0
    let walletCount = 0

    order.forEach((order)=>{
      if(order.paymentMethod === 'cod'){
        codCount++
      }else if(order.paymentMethod === 'razorpay'){
        razorpayCount++
      }else if(order.paymentMethod === 'wallet'){
        walletCount++
      }
  
    })

    return res.json({
      codCount: codCount,
      razorpayCount: razorpayCount,
      walletCount: walletCount
    });
    

  } catch (error) {
    console.log(error.message);
    return res.status(500)
  }
}


}

module.exports = salesController

