describe("Calendar Stuff", function() {
  var emailBuilder;

  beforeEach(function() {
    emailBuilder = new EmailBuilder();
  });

  describe('Something something', function() {
    var today;

    beforeEach(function() {
      today = new Date();
    });

    it('should be main entry', function() {
      var expected = '<strong>10:00</strong> AM';
      var unit = 'hours';
      var minutesFrom = 60;

      today.setHours(10, 0, 0, 0);
      var dateString = calendar.constructTimeEntry(today, minutesFrom, unit);

      expect(dateString.date).toBe('<strong>10:00</strong> AM');
    });


  });


});
