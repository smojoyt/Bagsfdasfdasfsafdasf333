Public Class Form1
    Private Sub btnCLose_Click(sender As Object, e As EventArgs) Handles btnCLose.Click
        Me.Close()
    End Sub

    Private Sub imgHearts_Click(sender As Object, e As EventArgs) Handles imgHearts.Click
        lblMain.Text = "Hearts"
    End Sub
End Class
